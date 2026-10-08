import React from 'react';

const Card = ({ card, index }) => {
  const style = { transform: `translateY(${index * -5}px)`, zIndex: index, animationDelay: `${index * 0.15}s` };
  
  if (card.isHidden) {
    return <div className="card card-hidden" style={style}><div className="card-back-pattern" /></div>;
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitSymbol = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[card.suit];

  return (
    <div className={`card ${isRed ? 'card-red' : 'card-black'}`} style={style}>
      <div className="card-top-left"><span className="card-value">{card.label}</span><span className="card-suit-small">{suitSymbol}</span></div>
      <div className="card-center"><span className="card-suit-large">{suitSymbol}</span></div>
      <div className="card-bottom-right"><span className="card-value">{card.label}</span><span className="card-suit-small">{suitSymbol}</span></div>
    </div>
  );
};

export default Card;