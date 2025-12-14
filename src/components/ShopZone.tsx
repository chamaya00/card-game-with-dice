'use client';

import { useState } from 'react';
import { Card as CardType, Player } from '@/types/game';
import { Card } from './Card';

interface ShopZoneProps {
  shopCards: CardType[];
  shoppingPlayer: Player;
  onBuyItem: (shopItemId: string, tradeInCardIds: string[]) => void;
  onSkipTurn: () => void;
}

export function ShopZone({
  shopCards,
  shoppingPlayer,
  onBuyItem,
  onSkipTurn,
}: ShopZoneProps) {
  const [selectedShopItem, setSelectedShopItem] = useState<string | null>(null);
  const [selectedInventoryCards, setSelectedInventoryCards] = useState<string[]>([]);

  const selectedItem = shopCards.find(c => c.id === selectedShopItem);
  const totalGold = selectedInventoryCards.reduce((sum, cardId) => {
    const card = shoppingPlayer.inventory.find(c => c.id === cardId);
    return sum + (card?.goldValue || 0);
  }, 0);

  const canAfford = selectedItem && totalGold >= (selectedItem.cost || 0);

  const handleToggleInventoryCard = (cardId: string) => {
    setSelectedInventoryCards(prev =>
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const handlePurchase = () => {
    if (selectedShopItem && canAfford) {
      onBuyItem(selectedShopItem, selectedInventoryCards);
      setSelectedShopItem(null);
      setSelectedInventoryCards([]);
    }
  };

  const handleSkip = () => {
    setSelectedShopItem(null);
    setSelectedInventoryCards([]);
    onSkipTurn();
  };

  return (
    <div className="space-y-6">
      {/* Shop Items */}
      <div>
        <h2 className="text-white/70 text-sm font-medium mb-4 text-center uppercase tracking-wider">
          Shop - Click to Select Item
        </h2>
        <div className="flex flex-wrap gap-4 justify-center">
          {shopCards.map(card => (
            <div
              key={card.id}
              onClick={() => setSelectedShopItem(card.id)}
              className={`
                cursor-pointer transition-all duration-200
                ${selectedShopItem === card.id
                  ? 'ring-4 ring-yellow-400 scale-105'
                  : 'hover:scale-105'
                }
              `}
            >
              <Card card={card} selectable={true} />
            </div>
          ))}
        </div>
      </div>

      {/* Purchase Interface */}
      {selectedItem && (
        <div className="bg-black/30 rounded-xl p-6 space-y-4">
          <h3 className="text-white text-lg font-bold text-center">
            Purchase {selectedItem.name} ({selectedItem.cost} Gold)
          </h3>

          <div className="text-white text-center">
            <p className="text-sm mb-2">Select monster cards to trade in (Total: {totalGold} Gold)</p>
            {canAfford ? (
              <p className="text-green-400 font-bold">✓ You can afford this!</p>
            ) : (
              <p className="text-red-400">Need {(selectedItem.cost || 0) - totalGold} more gold</p>
            )}
          </div>

          {/* Inventory Selection */}
          <div>
            <h4 className="text-white/70 text-sm font-medium mb-2 text-center">
              Your Monster Cards (Inventory)
            </h4>
            {shoppingPlayer.inventory.length === 0 ? (
              <p className="text-white/50 text-center text-sm">No monster cards to trade</p>
            ) : (
              <div className="flex flex-wrap gap-2 justify-center max-h-48 overflow-y-auto">
                {shoppingPlayer.inventory.map(card => (
                  <div
                    key={card.id}
                    onClick={() => handleToggleInventoryCard(card.id)}
                    className={`
                      cursor-pointer p-2 rounded-lg border-2 transition-all
                      ${selectedInventoryCards.includes(card.id)
                        ? 'border-yellow-400 bg-yellow-400/20'
                        : 'border-white/20 hover:border-white/40'
                      }
                    `}
                  >
                    <div className="text-white text-xs font-bold">{card.name}</div>
                    <div className="text-yellow-300 text-xs">💰 {card.goldValue}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={handlePurchase}
              disabled={!canAfford}
              className={`
                px-6 py-3 rounded-lg font-bold transition-all
                ${canAfford
                  ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Buy Item
            </button>
            <button
              onClick={() => setSelectedShopItem(null)}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Skip Button */}
      {!selectedItem && (
        <div className="text-center">
          <button
            onClick={handleSkip}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition-all shadow-lg"
          >
            Skip Shopping Turn
          </button>
        </div>
      )}
    </div>
  );
}
