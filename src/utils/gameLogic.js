// Game logic utilities for Blackjack

import { values } from './deck';

/**
 * Calculates the value of a hand in Blackjack
 * Ace can be 1 or 11, whichever is better without busting
 * @param {Array} hand - Array of card objects
 * @returns {number} Best possible hand value
 */
export const calculateHandValue = (hand) => {
  let value = 0;
  let aceCount = 0;

  for (const card of hand) {
    const cardValue = card.value;
    if (cardValue === 'A') {
      aceCount++;
      value += 11; // Initially count Ace as 11
    } else if (['K', 'Q', 'J'].includes(cardValue)) {
      value += 10;
    } else {
      value += parseInt(cardValue);
    }
  }

  // If value > 21 and we have aces, convert aces from 11 to 1
  while (value > 21 && aceCount > 0) {
    value -= 10;
    aceCount--;
  }

  return value;
};

/**
 * Checks if a hand is a blackjack (21 with exactly 2 cards)
 * @param {Array} hand - Array of card objects
 * @returns {boolean} True if hand is blackjack
 */
export const isBlackjack = (hand) => {
  return hand.length === 2 && calculateHandValue(hand) === 21;
};

/**
 * Checks if a hand is bust (value > 21)
 * @param {Array} hand - Array of card objects
 * @returns {boolean} True if hand is bust
 */
export const isBust = (hand) => {
  return calculateHandValue(hand) > 21;
};

/**
 * Determines the winner of the game
 * @param {Array} playerHand - Player's cards
 * @param {Array} dealerHand - Dealer's cards
 * @returns {string} Game outcome: 'player', 'dealer', 'push', or 'incomplete'
 */
export const determineWinner = (playerHand, dealerHand) => {
  const playerValue = calculateHandValue(playerHand);
  const dealerValue = calculateHandValue(dealerHand);
  const playerBust = isBust(playerHand);
  const dealerBust = isBust(dealerHand);
  const playerBJ = isBlackjack(playerHand);
  const dealerBJ = isBlackjack(dealerHand);

  // If both bust, dealer wins (house rule)
  if (playerBust && dealerBust) {
    return 'dealer';
  }

  // Check for blackjacks
  if (playerBJ && !dealerBJ) {
    return 'player';
  }
  if (dealerBJ && !playerBJ) {
    return 'dealer';
  }
  if (playerBJ && dealerBJ) {
    return 'push';
  }

  // Check for busts
  if (playerBust) {
    return 'dealer';
  }
  if (dealerBust) {
    return 'player';
  }

  // If neither bust, compare values
  if (playerValue > dealerValue) {
    return 'player';
  }
  if (dealerValue > playerValue) {
    return 'dealer';
  }

  return 'push';
};

/**
 * Returns a descriptive message for the game outcome
 * @param {string} outcome - Result from determineWinner
 * @param {Array} playerHand - Player's cards
 * @param {Array} dealerHand - Dealer's cards
 * @returns {string} Message to display
 */
export const getGameMessage = (outcome, playerHand, dealerHand) => {
  const playerValue = calculateHandValue(playerHand);
  const dealerValue = calculateHandValue(dealerHand);

  switch (outcome) {
    case 'player':
      if (isBlackjack(playerHand)) {
        return 'Blackjack! You win!';
      }
      return `You win! (${playerValue} vs ${dealerValue})`;
    case 'dealer':
      if (isBlackjack(dealerHand)) {
        return 'Dealer has blackjack. You lose.';
      }
      if (isBust(dealerHand)) {
        return `Dealer busts! You win! (${playerValue} vs ${dealerValue})`;
      }
      if (isBust(playerHand)) {
        return `You bust! Dealer wins. (${playerValue} vs ${dealerValue})`;
      }
      return `Dealer wins! (${dealerValue} vs ${playerValue})`;
    case 'push':
      if (isBlackjack(playerHand) && isBlackjack(dealerHand)) {
        return 'Both have blackjack! Push.';
      }
      return `Push! Both have ${playerValue}.`;
    default:
      return 'Game in progress...';
  }
};