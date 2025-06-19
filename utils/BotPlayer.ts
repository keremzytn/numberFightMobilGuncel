import { GameState } from './GameEngine';

export class BotPlayer {
  private difficulty: 'easy' | 'medium' | 'hard';

  constructor(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.difficulty = difficulty;
  }

  public selectCard(validCards: number[], gameState: GameState): number {
    if (validCards.length === 0) {
      throw new Error('No valid cards available');
    }

    switch (this.difficulty) {
      case 'easy':
        return this.selectRandomCard(validCards);
      case 'medium':
        return this.selectSmartCard(validCards, gameState);
      case 'hard':
        return this.selectOptimalCard(validCards, gameState);
      default:
        return this.selectSmartCard(validCards, gameState);
    }
  }

  private selectRandomCard(validCards: number[]): number {
    const randomIndex = Math.floor(Math.random() * validCards.length);
    return validCards[randomIndex];
  }

  private selectSmartCard(validCards: number[], gameState: GameState): number {
    // Medium difficulty: Mix of strategy and randomness
    
    // Early game (rounds 1-3): Play more conservatively
    if (gameState.currentRound <= 3) {
      // Prefer middle cards to keep options open
      const middleCards = validCards.filter(card => card >= 3 && card <= 5);
      if (middleCards.length > 0) {
        return middleCards[Math.floor(Math.random() * middleCards.length)];
      }
    }

    // Mid game (rounds 4-5): Balance offense and defense
    if (gameState.currentRound <= 5) {
      // If behind, play higher cards
      if (gameState.player2Score < gameState.player1Score) {
        const highCards = validCards.filter(card => card >= 5);
        if (highCards.length > 0) {
          return Math.max(...highCards);
        }
      }
      // If ahead or tied, play strategically
      const strategicCards = validCards.filter(card => card >= 3 && card <= 6);
      if (strategicCards.length > 0) {
        return strategicCards[Math.floor(Math.random() * strategicCards.length)];
      }
    }

    // Late game (rounds 6-7): Go for the win
    if (gameState.currentRound >= 6) {
      // If behind, must play high cards
      if (gameState.player2Score < gameState.player1Score) {
        return Math.max(...validCards);
      }
      // If ahead, can be more conservative
      if (gameState.player2Score > gameState.player1Score) {
        const safeCards = validCards.filter(card => card >= 4);
        if (safeCards.length > 0) {
          return safeCards[Math.floor(Math.random() * safeCards.length)];
        }
      }
    }

    // Fallback: random selection
    return this.selectRandomCard(validCards);
  }

  private selectOptimalCard(validCards: number[], gameState: GameState): number {
    // Hard difficulty: Advanced strategy
    
    const remainingRounds = 8 - gameState.currentRound;
    const scoreDifference = gameState.player2Score - gameState.player1Score;
    
    // If significantly behind and few rounds left, play aggressively
    if (scoreDifference <= -2 && remainingRounds <= 2) {
      return Math.max(...validCards);
    }
    
    // If significantly ahead, play conservatively but not too low
    if (scoreDifference >= 2) {
      const conservativeCards = validCards.filter(card => card >= 3 && card <= 5);
      if (conservativeCards.length > 0) {
        return conservativeCards[Math.floor(Math.random() * conservativeCards.length)];
      }
    }
    
    // Analyze opponent's remaining cards and play accordingly
    const opponentUsedCards = gameState.player1UsedCards;
    const opponentRemainingHighCards = [6, 7].filter(card => !opponentUsedCards.includes(card));
    
    // If opponent has high cards left, be more aggressive
    if (opponentRemainingHighCards.length > 0 && validCards.includes(7)) {
      // Sometimes play the 7 to counter their high cards
      if (Math.random() < 0.6) {
        return 7;
      }
    }
    
    // Default strategic play
    return this.selectSmartCard(validCards, gameState);
  }

  public setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.difficulty = difficulty;
  }

  public getDifficulty(): string {
    return this.difficulty;
  }
}