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
  const [placedChips, setPlacedChips] = useState([]);
  const [chipAnimation, setChipAnimation] = useState('');
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState(1000);

  useEffect(() => setDeck(shuffleDeck(createDeck())), []);

  const placeBet = (amount) => {
    if (balance >= amount) { 
      setBalance(b => b - amount); 
      setCurrentBet(c => c + amount); 
      setPlacedChips(prev => [...prev, { id: Date.now() + Math.random(), value: amount }]);
    }
  };
  const clearBet = () => { 
    setBalance(b => b + currentBet); 
    setCurrentBet(0); 
    setPlacedChips([]);
  };

  const resetGame = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setCurrentBet(0);
    setPlacedChips([]);
    setChipAnimation('');
    setGameState('betting');
    setMessage('');
  };

  const handleAddCredit = (amount) => {
    setBalance(b => b + amount);
    setShowCreditModal(false);
  };

  const handleGameOver = (pHand, dHand, reason) => {
    const finalDealerHand = [...dHand];
    if (finalDealerHand[1]?.isHidden) finalDealerHand[1].isHidden = false;
    setDealerHand(finalDealerHand);
    setGameState('gameOver');

    if (['playerBlackjack', 'playerWins', 'dealerBust', 'push'].includes(reason)) {
      setChipAnimation('win');
    } else {
      setChipAnimation('lose');
    }

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
      <div className="hand-header">
        <h2 className="hand-title">{title}</h2>
        {score !== 0 && score !== '0' && <div className="hand-score">{score}</div>}
      </div>
      <div className="cards-wrapper">
        {cards.length === 0 ? <div className="empty-hand-placeholder">No cards</div> : cards.map((c, i) => <Card key={`${c.id}-${i}`} card={c} index={i} />)}
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-titles-wrapper">
          <div className="header-logo hidden-mobile">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path></svg>
          </div>
          <div className="header-titles">
            <h1>BLACKJACK <span className="text-gold">21</span></h1>
            <div className="subtitle">GURUNGCLUB</div>
          </div>
        </div>
        <div className="header-center hidden-mobile">
          <span className="status-dot"></span> PRIVATE SUITE <span className="status-divider">|</span> {gameState === 'betting' ? 'Open for betting' : 'Round in play'}
        </div>
        <div className="header-actions">
          <button className="btn-add-credit" onClick={() => setShowCreditModal(true)}>Add Credit</button>
          <button className="icon-btn hidden-mobile">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          </button>
          <button className="icon-btn hidden-mobile">?</button>
        </div>
      </header>
      <main className="game-table">
        <div className="table-center">
          <div className="table-watermarks">
            <div className="wm-left hidden-mobile">
              <div className="wm-crown">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path></svg>
              </div>
              <div className="wm-title">HIGH ROLLER</div>
              <div className="wm-sub">PRIVATE MEMBERS CLUB</div>
            </div>
            <div className="wm-center">
              <div className="watermark-circle">21</div>
              <div className="wm-sub wm-stakes hidden-mobile">SET YOUR STAKES BELOW</div>
              <div className="wm-sub wm-pays hidden-desktop">BLACKJACK PAYS 3 : 2</div>
            </div>
            <div className="wm-right hidden-mobile">
              <div className="wm-sub">BLACKJACK PAYS 3 : 2</div>
            </div>
          </div>
          <div className="gold-corner gc-tl"></div><div className="gold-corner gc-tr"></div><div className="gold-corner gc-bl"></div><div className="gold-corner gc-br"></div><div className="gold-corner gc-ml"></div><div className="gold-corner gc-mr"></div>
          <div className="pocket top-left"></div><div className="pocket top-right"></div><div className="pocket middle-left"></div><div className="pocket middle-right"></div><div className="pocket bottom-left"></div><div className="pocket bottom-right"></div>
          
          {/* Betting Zone */}
          <div className={`bet-zone ${chipAnimation}`}>
            {placedChips.map((chip, i) => {
              let chipClass = 'chip-5';
              if (chip.value >= 1000) chipClass = 'chip-1000';
              else if (chip.value >= 500) chipClass = 'chip-500';
              else if (chip.value >= 100) chipClass = 'chip-100';
              else if (chip.value >= 25) chipClass = 'chip-25';
              
              let displayVal = chip.value >= 1000 ? `${(chip.value/1000).toFixed(chip.value%1000===0?0:1)}k` : chip.value;
              
              return (
                <div key={chip.id} className={`table-chip ${chipClass}`} style={{ bottom: `${i * 4}px`, zIndex: i }}>
                  {displayVal}
                </div>
              );
            })}
          </div>

          <div className="dealer-area">{renderHand("Dealer", dealerHand, gameState === 'playing' ? (dealerHand.length > 0 ? `${calculateScore([dealerHand[0]])} + ?` : 0) : calculateScore(dealerHand), gameState === 'dealerTurn')}</div>
          
          <div className="center-action-box glass-panel animate-pop">
            {gameState === 'betting' && <>
              <div className="action-title text-gold">Place your bet</div>
              <div className="action-subtitle">Choose your chips. Own the table.</div>
            </>}
            {gameState === 'playing' && <>
              <div className="action-title text-gold">Your move</div>
              <div className="action-subtitle">{calculateScore(playerHand)} in hand. Play it your way.</div>
            </>}
            {gameState === 'gameOver' && <>
              <div className="action-title text-gold">{message}</div>
              <button className="btn btn-primary mt-3" onClick={resetGame}>Play Again</button>
            </>}
            {gameState === 'dealerTurn' && <>
              <div className="action-title text-gold">Dealer's turn</div>
              <div className="action-subtitle">Good luck...</div>
            </>}
          </div>
          <div className="player-area">{renderHand("Player", playerHand, calculateScore(playerHand), gameState === 'playing')}</div>
        </div>

        <div className="bottom-controls">
          <div className="controls-container">
            {gameState === 'betting' && (
              <div className="deal-btn-wrapper">
                <button className="btn btn-primary btn-deal" onClick={dealCards}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                  Deal Cards
                  <span className="key-hint enter-hint hidden-mobile">↵</span>
                </button>
                <div className="btn-sub hidden-mobile">Press Enter to begin your hand</div>
              </div>
            )}
            {gameState === 'playing' && <>
              <button className="btn btn-hit btn-large" onClick={hit}>Hit <span className="key-hint hidden-mobile">H</span></button>
              <button className="btn btn-stand btn-large" onClick={() => setGameState('dealerTurn')}>Stand <span className="key-hint hidden-mobile">S</span></button>
              {playerHand.length === 2 && balance >= currentBet && <button className="btn btn-double btn-large" onClick={doubleDown}>Double Down <span className="key-hint hidden-mobile">D</span></button>}
            </>}
            {gameState === 'gameOver' && (
              <div className="deal-btn-wrapper">
                <button className="btn btn-primary btn-deal" onClick={resetGame}>Play Again</button>
              </div>
            )}
          </div>
          
          <div className="betting-area glass-panel">
            <div className="bank-info">
              <div className="info-box info-left">
                <span className="info-label">Balance:</span>
                <span className="info-value">NPR {balance.toLocaleString()}</span>
                <span className="info-sub hidden-mobile">Available to play</span>
              </div>
              <div className="info-divider hidden-mobile"></div>
              <div className="info-box info-left">
                <span className="info-label">Current Bet:</span>
                <span className="info-value text-gold">NPR {currentBet.toLocaleString()}</span>
                <span className="info-sub hidden-mobile">{gameState==='betting' ? 'Ready for the next hand' : 'Committed to this hand'}</span>
              </div>
            </div>
            
            <div className="center-betting-rack">
              {gameState === 'betting' && <>
                <div className="desktop-chip-instruction hidden-mobile">
                  <div className="d-title text-gold">YOUR STAKES</div>
                  <div className="d-sub">Select chips to add to your bet</div>
                </div>
                <div className="chip-rack">
                  {[5, 25, 100, 500, 1000].map(chip => <button key={chip} className={`chip chip-${chip} ${currentBet > 0 && currentBet % chip === 0 ? 'chip-active' : ''}`} onClick={() => placeBet(chip)} disabled={balance < chip}>{chip}</button>)}
                </div>
                <div className="action-row">
                  <button className="btn-all-in" onClick={() => placeBet(balance)} disabled={balance === 0}>
                    <div>ALL IN</div>
                    <div className="all-in-sub">NPR {balance.toLocaleString()}</div>
                  </button>
                  <button className="btn-clear-bet" onClick={clearBet} disabled={currentBet === 0}>Clear</button>
                </div>
              </>}
              {gameState === 'playing' && (
                <div className="center-betting-locked hidden-mobile">
                  <div className="lock-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </div>
                  <div className="lock-text text-left">
                    <div className="d-title text-gold">BET LOCKED</div>
                    <div className="d-sub">Double Down adds NPR {currentBet.toLocaleString()} to your bet and deals one final card.</div>
                  </div>
                  <div className="all-in-locked-badge">
                     ALL IN<br/>LOCKED
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showCreditModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-pop">
            <div className="modal-header">
              <span className="modal-suptitle text-gold">YOUR BANKROLL</span>
              <h3>Add Credit</h3>
              <p className="modal-subtitle">Keep your seat at the table.<br/>Choose an amount to top up your balance.</p>
              <button className="modal-close-icon" onClick={() => setShowCreditModal(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="credit-options">
              {[1000, 5000, 10000].map(amt => (
                <div key={amt} className={`credit-option ${selectedCredit === amt ? 'selected' : ''}`} onClick={() => setSelectedCredit(amt)}>
                  <span>NPR {amt.toLocaleString()}</span>
                  <div className="radio-btn">{selectedCredit === amt && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  )}</div>
                </div>
              ))}
            </div>
            
            <button className="btn btn-primary btn-add-submit" onClick={() => handleAddCredit(selectedCredit)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12h2"></path></svg>
              Add NPR {selectedCredit.toLocaleString()}
            </button>
            <div className="modal-footer-text">
              New balance: <strong>NPR {(balance + selectedCredit).toLocaleString()}</strong>
            </div>
            <div className="modal-security">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Credit is added to your available balance.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;