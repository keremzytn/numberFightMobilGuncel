const { v4: uuidv4 } = require('uuid');
const Match = require('./Match');

class GameRoom {
    constructor(player1Id, player2Id) {
        this.id = uuidv4();
        this.player1Id = player1Id;
        this.player2Id = player2Id;
        this.currentRound = 1;
        this.player1Score = 0;
        this.player2Score = 0;
        this.player1UsedCards = [];
        this.player2UsedCards = [];
        this.player1ForbiddenCards = [];
        this.player2ForbiddenCards = [];
        this.player1Card = null;
        this.player2Card = null;
        this.roundTimer = null;
        this.status = 'waiting';
        this.winner = null;
        this.roundStartTime = null;
    }

    getValidCards(playerId) {
        const usedCards = playerId === this.player1Id ? this.player1UsedCards : this.player2UsedCards;
        const forbiddenCards = playerId === this.player1Id ? this.player1ForbiddenCards : this.player2ForbiddenCards;
        const allCards = [1, 2, 3, 4, 5, 6, 7];
        if (this.currentRound === 7) {
            // Son raundda yasaklı kart yok
            return allCards.filter(card => !usedCards.includes(card));
        }
        return allCards.filter(card => !usedCards.includes(card) && !forbiddenCards.includes(card));
    }

    playCard(playerId, cardNumber) {
        if (this.status !== 'playing') {
            throw new Error('Game is not in playing state');
        }

        const validCards = this.getValidCards(playerId);
        if (!validCards.includes(cardNumber)) {
            throw new Error('Invalid card selection');
        }

        if (playerId === this.player1Id) {
            this.player1Card = cardNumber;
        } else {
            this.player2Card = cardNumber;
        }

        if (this.player1Card !== null && this.player2Card !== null) {
            this.resolveRound();
        }
    }

    resolveRound() {
        if (this.roundTimer) {
            clearTimeout(this.roundTimer);
            this.roundTimer = null;
        }

        let roundWinner = null;
        if (this.player1Card > this.player2Card) {
            roundWinner = this.player1Id;
            this.player1Score++;
        } else if (this.player2Card > this.player1Card) {
            roundWinner = this.player2Id;
            this.player2Score++;
        }

        this.player1UsedCards.push(this.player1Card);
        this.player2UsedCards.push(this.player2Card);

        this.updateForbiddenCards(this.player1Id, this.player1Card);
        this.updateForbiddenCards(this.player2Id, this.player2Card);

        const roundResult = {
            round: this.currentRound,
            player1Card: this.player1Card,
            player2Card: this.player2Card,
            winner: roundWinner,
            player1Score: this.player1Score,
            player2Score: this.player2Score,
        };

        return roundResult;
    }

    updateForbiddenCards(playerId, lastPlayedCard) {
        const forbiddenCards = [];
        if (lastPlayedCard > 1) {
            forbiddenCards.push(lastPlayedCard - 1);
        }
        if (lastPlayedCard < 7) {
            forbiddenCards.push(lastPlayedCard + 1);
        }

        const usedCards = playerId === this.player1Id ? this.player1UsedCards : this.player2UsedCards;
        const validForbiddenCards = forbiddenCards.filter(card => !usedCards.includes(card));

        if (playerId === this.player1Id) {
            this.player1ForbiddenCards = validForbiddenCards;
        } else {
            this.player2ForbiddenCards = validForbiddenCards;
        }
    }

    startRound() {
        this.status = 'playing';
        this.roundStartTime = Date.now();
        return this.getGameState();
    }

    handleTimeOut() {
        if (this.player1Card === null) {
            const validCards = this.getValidCards(this.player1Id);
            if (validCards.length > 0) {
                this.player1Card = Math.min(...validCards);
            }
        }

        if (this.player2Card === null) {
            const validCards = this.getValidCards(this.player2Id);
            if (validCards.length > 0) {
                this.player2Card = Math.min(...validCards);
            }
        }

        if (this.player1Card !== null && this.player2Card !== null) {
            return this.resolveRound();
        }
        return null;
    }

    endGame() {
        this.status = 'finished';

        if (this.player1Score > this.player2Score) {
            this.winner = this.player1Id;
        } else if (this.player2Score > this.player1Score) {
            this.winner = this.player2Id;
        } else {
            this.winner = null;
        }

        // Maç sonucunu veritabanına kaydet
        Match.create({
            player1Id: this.player1Id,
            player2Id: this.player2Id,
            player1Score: this.player1Score,
            player2Score: this.player2Score,
            winner: this.winner,
            createdAt: new Date(),
            totalRounds: 7
        });

        return {
            winner: this.winner,
            player1Score: this.player1Score,
            player2Score: this.player2Score,
            totalRounds: 7
        };
    }

    getGameState() {
        return {
            gameId: this.id,
            currentRound: this.currentRound,
            player1Score: this.player1Score,
            player2Score: this.player2Score,
            status: this.status,
            roundStartTime: this.roundStartTime
        };
    }
}

module.exports = GameRoom; 