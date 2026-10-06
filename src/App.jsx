import React, { useState, useEffect, useCallback } from 'react';
import Card from './components/Card';
import { createDeck, shuffleDeck, calculateScore } from './utils/deck';
import './App.css';

function App() {
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameState, setGameState] = useState('betting'); // 'betting', 'playing', 'dealerTurn', 'gameOver'
  const [message, setMessage] = useState('');
  const [balance, setBalance] = useState(1000);
  const [currentBet, setCurrentBet] = useState(0);

  useEffect(() => setDeck(shuffleDeck(createDeck())), []);

  const placeBet = (amount) => {
    if (balance >= amount) { setBalance(b => b - amount); setCurrentBet(c => c + amount); }
  };
  const clearBet = () => { setBalance(b => b + currentBet); setCurrentBet(0); };

  const handleGameOver = (pHand, dHand, reason) => {
    const finalDealerHand = [...dHand];
    if (finalDealerHand[1]?.isHidden) finalDealerHand[1].isHidden = false;
    setDealerHand(finalDealerHand);
    setGameState('gameOver');

    const payouts = {
      playerBlackjack: { msg: 'Blackjack! You win 3:2!', mult: 2.5 },
      playerBust: { msg: 'Bust! Dealer wins.', mult: 0 },
      dealerBust: { msg: 'Dealer busts! You win!', mult: 2 },
      playerWins: { msg: 'You win!', mult: 2 },
      dealerWins: { msg: 'Dealer wins.', mult: 0 },
      push: { msg: 'Push. Bet returned.', mult: 1 }
    };
    setMessage(payouts[reason].msg);
    if (payouts[reason].mult > 0) setBalance(b => b + (currentBet * payouts[reason].mult));
  };

  const dealCards = () => {
    if (currentBet === 0) return setMessage("Please place a bet first!");
    const currentDeck = deck.length < 10 ? shuffleDeck(createDeck()) : [...deck];
    const pHand = [currentDeck.pop(), currentDeck.pop()];
    const dHand = [currentDeck.pop(), { ...currentDeck.pop(), isHidden: true }];
    setPlayerHand(pHand); setDealerHand(dHand); setDeck(currentDeck);
    setGameState('playing'); setMessage('');
    if (calculateScore(pHand) === 21) handleGameOver(pHand, dHand, 'playerBlackjack');
  };

  const hit = () => {
    const newHand = [...playerHand, deck.pop()];
    setPlayerHand(newHand); setDeck([...deck]);
    if (calculateScore(newHand) > 21) handleGameOver(newHand, dealerHand, 'playerBust');
  };

  const doubleDown = () => {
    if (balance >= currentBet) {
      setBalance(b => b - currentBet); setCurrentBet(c => c * 2);
      const newHand = [...playerHand, deck.pop()];
      setPlayerHand(newHand); setDeck([...deck]);
      calculateScore(newHand) > 21 ? handleGameOver(newHand, dealerHand, 'playerBust') : setGameState('dealerTurn');
    }
  };

  const playDealerTurn = useCallback(() => {
    let dHand = [...dealerHand]; dHand[1].isHidden = false;
    let currentDeck = [...deck];
    while (calculateScore(dHand) < 17) dHand.push(currentDeck.pop());
    setDealerHand([...dHand]); setDeck(currentDeck);
    
    const dScore = calculateScore(dHand), pScore = calculateScore(playerHand);
    handleGameOver(playerHand, dHand, dScore > 21 ? 'dealerBust' : dScore > pScore ? 'dealerWins' : dScore < pScore ? 'playerWins' : 'push');
  }, [dealerHand, deck, playerHand]);

  useEffect(() => {
    if (gameState === 'dealerTurn') {
      const t = setTimeout(playDealerTurn, 500);
      return () => clearTimeout(t);
    }
  }, [gameState, playDealerTurn]);

  const renderHand = (title, cards, score, isActive) => (
    <div className={`hand-container ${isActive ? 'active-hand' : ''}`}>
      <div className="hand-header"><h2 className="hand-title">{title}</h2>{score > 0 && <div className="hand-score">{score}</div>}</div>
      <div className="cards-wrapper">
        {cards.length === 0 ? <div className="empty-hand-placeholder">No cards</div> : cards.map((c, i) => <Card key={`${c.id}-${i}`} card={c} index={i} />)}
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <header className="app-header"><h1>BLACKJACK <span className="text-gold">21</span></h1></header>
      <main className="game-table">
        <div className="table-center">
          <div className="gold-corner gc-tl"></div><div className="gold-corner gc-tr"></div><div className="gold-corner gc-bl"></div><div className="gold-corner gc-br"></div><div className="gold-corner gc-ml"></div><div className="gold-corner gc-mr"></div>
          <div className="pocket top-left"></div><div className="pocket top-right"></div><div className="pocket middle-left"></div><div className="pocket middle-right"></div><div className="pocket bottom-left"></div><div className="pocket bottom-right"></div>
          
          <div className="dealer-area">{renderHand("Dealer", dealerHand, gameState === 'playing' ? 0 : calculateScore(dealerHand), gameState === 'dealerTurn')}</div>
          <div className="message-area">
            {message && <div className="game-message animate-pop">{message}</div>}
            {gameState === 'gameOver' && <button className="btn btn-primary mt-3" onClick={() => { setPlayerHand([]); setDealerHand([]); setCurrentBet(0); setGameState('betting'); setMessage(''); }}>Play Again</button>}
          </div>
          <div className="player-area">{renderHand("Player", playerHand, calculateScore(playerHand), gameState === 'playing')}</div>
        </div>

        <div className="bottom-controls">
          <div className="controls-container">
            {gameState === 'betting' && <button className="btn btn-primary" onClick={dealCards}>Deal Cards</button>}
            {gameState === 'playing' && <>
              <button className="btn btn-hit" onClick={hit}>Hit</button>
              <button className="btn btn-stand" onClick={() => setGameState('dealerTurn')}>Stand</button>
              {playerHand.length === 2 && balance >= currentBet && <button className="btn btn-double" onClick={doubleDown}>Double Down</button>}
            </>}
          </div>
          
          <div className="betting-area glass-panel">
            <div className="bank-info">
              <div className="info-box"><span className="info-label">Balance</span><span className="info-value">${balance}</span></div>
              <div className="info-box"><span className="info-label">Current Bet</span><span className="info-value text-gold">${currentBet}</span></div>
            </div>
            {gameState === 'betting' && <div className="chip-rack">
              {[5, 25, 100, 500].map(chip => <button key={chip} className={`chip chip-${chip}`} onClick={() => placeBet(chip)} disabled={balance < chip}>${chip}</button>)}
              <button className="btn-clear-bet" onClick={clearBet} disabled={currentBet === 0}>Clear</button>
            </div>}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;