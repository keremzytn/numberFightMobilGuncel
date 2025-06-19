export interface GameState {
  currentRound: number;
  player1Score: number;
  player2Score: number;
  player1UsedCards: number[];
  player2UsedCards: number[];
  player1ForbiddenCards: number[];
  player2ForbiddenCards: number[];
  status: 'waiting' | 'playing' | 'finished';
  winner: number | null; // 1, 2, or null for draw
}

export interface RoundResult {
  round: number;
  player1Card: number;
  player2Card: number;
  winner: number | null; // 1, 2, or null for draw
  player1Score: number;
  player2Score: number;
}

export class GameEngine {
  private gameState: GameState;

  constructor() {
    this.gameState = this.initializeGame();
  }

  private initializeGame(): GameState {
    return {
      currentRound: 1,
      player1Score: 0,
      player2Score: 0,
      player1UsedCards: [],
      player2UsedCards: [],
      player1ForbiddenCards: [],
      player2ForbiddenCards: [],
      status: 'playing',
      winner: null,
    };
  }

  public getGameState(): GameState {
    return { ...this.gameState };
  }

  public getValidCards(playerId: number): number[] {
    const usedCards = playerId === 1 ? this.gameState.player1UsedCards : this.gameState.player2UsedCards;
    const forbiddenCards = playerId === 1 ? this.gameState.player1ForbiddenCards : this.gameState.player2ForbiddenCards;
    
    const allCards = [1, 2, 3, 4, 5, 6, 7];
    return allCards.filter(card => 
      !usedCards.includes(card) && !forbiddenCards.includes(card)
    );
  }

  public isValidMove(playerId: number, cardNumber: number): boolean {
    return this.getValidCards(playerId).includes(cardNumber);
  }

  public playRound(player1Card: number, player2Card: number): RoundResult {
    if (this.gameState.status !== 'playing') {
      throw new Error('Game is not in playing state');
    }

    if (!this.isValidMove(1, player1Card) || !this.isValidMove(2, player2Card)) {
      throw new Error('Invalid card selection');
    }

    // Determine round winner
    let roundWinner: number | null = null;
    if (player1Card > player2Card) {
      roundWinner = 1;
      this.gameState.player1Score++;
    } else if (player2Card > player1Card) {
      roundWinner = 2;
      this.gameState.player2Score++;
    }
    // No points awarded for draws

    // Update used cards
    this.gameState.player1UsedCards.push(player1Card);
    this.gameState.player2UsedCards.push(player2Card);

    // Update forbidden cards for next round
    this.updateForbiddenCards(1, player1Card);
    this.updateForbiddenCards(2, player2Card);

    const result: RoundResult = {
      round: this.gameState.currentRound,
      player1Card,
      player2Card,
      winner: roundWinner,
      player1Score: this.gameState.player1Score,
      player2Score: this.gameState.player2Score,
    };

    // Move to next round or end game
    if (this.gameState.currentRound >= 7) {
      this.endGame();
    } else {
      this.gameState.currentRound++;
      // Clear forbidden cards for the new round (they only last one round)
      this.gameState.player1ForbiddenCards = [];
      this.gameState.player2ForbiddenCards = [];
      // Re-add forbidden cards based on the last played card
      this.updateForbiddenCards(1, player1Card);
      this.updateForbiddenCards(2, player2Card);
    }

    return result;
  }

  private updateForbiddenCards(playerId: number, lastPlayedCard: number): void {
    const forbiddenCards: number[] = [];
    
    // Add card-1 and card+1 to forbidden list if they exist and aren't used
    if (lastPlayedCard > 1) {
      forbiddenCards.push(lastPlayedCard - 1);
    }
    if (lastPlayedCard < 7) {
      forbiddenCards.push(lastPlayedCard + 1);
    }

    // Filter out already used cards
    const usedCards = playerId === 1 ? this.gameState.player1UsedCards : this.gameState.player2UsedCards;
    const validForbiddenCards = forbiddenCards.filter(card => !usedCards.includes(card));

    if (playerId === 1) {
      this.gameState.player1ForbiddenCards = validForbiddenCards;
    } else {
      this.gameState.player2ForbiddenCards = validForbiddenCards;
    }
  }

  private endGame(): void {
    this.gameState.status = 'finished';
    
    if (this.gameState.player1Score > this.gameState.player2Score) {
      this.gameState.winner = 1;
    } else if (this.gameState.player2Score > this.gameState.player1Score) {
      this.gameState.winner = 2;
    } else {
      this.gameState.winner = null; // Draw
    }
  }

  public resetGame(): void {
    this.gameState = this.initializeGame();
  }

  public canPlayCard(playerId: number, cardNumber: number): boolean {
    if (this.gameState.status !== 'playing') return false;
    
    const usedCards = playerId === 1 ? this.gameState.player1UsedCards : this.gameState.player2UsedCards;
    const forbiddenCards = playerId === 1 ? this.gameState.player1ForbiddenCards : this.gameState.player2ForbiddenCards;
    
    return !usedCards.includes(cardNumber) && !forbiddenCards.includes(cardNumber);
  }
}