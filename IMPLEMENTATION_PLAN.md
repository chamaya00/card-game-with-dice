# Craps-RPG Implementation Plan

This document outlines the phased implementation plan for the Craps-RPG game based on the Game Design Document.

---

## Tech Stack

- **Framework:** Next.js 16+ (App Router)
- **UI Library:** React 19+
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **State Management:** React Context API (or Zustand for complex state)
- **Testing:** Jest + React Testing Library

---

## Phase 1: Project Foundation & Type Definitions

**Goal:** Set up project structure and define all core data types.

### Tasks

1. **Initialize Next.js project with TypeScript and Tailwind CSS**
   - Create `package.json` with dependencies
   - Configure TypeScript, ESLint, PostCSS
   - Set up folder structure (`src/app`, `src/components`, `src/types`, `src/lib`, `src/context`)

2. **Define TypeScript interfaces and types** (`src/types/game.ts`)
   - `Player` interface (id, name, gold, victoryPoints, damageCount, permanentCards, singleUseCards)
   - `Monster` interface (id, type, numbersToHit, remainingNumbers, points, goldReward)
   - `Card` interface with discriminated unions for card types:
     - `PermanentCard` (id, name, cost, effect, description)
     - `SingleUseCard` (id, name, cost, effect, description)
     - `PointCard` (id, name, cost, points)
   - `Bet` interface (playerId, type: 'FOR' | 'AGAINST', amount)
   - `GameState` interface (players, currentMonsterIndex, monsters, marketplace, turnState, damageLeaderId, etc.)
   - `TurnPhase` enum (MARKETPLACE_REFRESH, MARKET_PURCHASE, CARD_REVEAL, BETTING, COME_OUT_ROLL, POINT_PHASE, RESOLUTION)
   - `RollResult` type (natural, craps, point, hit, escape, crapOut)

3. **Define game constants** (`src/lib/constants.ts`)
   - `STARTING_GOLD = 4`
   - `VICTORY_POINTS_TO_WIN = 10`
   - `MAX_PERMANENT_CARDS = 6`
   - `MAX_SINGLE_USE_CARDS = 8`
   - `MARKETPLACE_SIZE = 8`
   - `MARKETPLACE_REFRESH_COST = 3`
   - `DAMAGE_LEADER_BONUS = 3`

4. **Create monster deck data** (`src/lib/monsterDeck.ts`)
   - 10 monsters with position, type, numbers to hit, points, and gold reward
   - Include boss monster with special mechanics

5. **Create card deck data** (`src/lib/cardDeck.ts`)
   - Permanent cards (7 types): +1 Die, Reroll, Shield, Lucky, Armor, Point Bonus, Double
   - Single-use cards (6 types): Stun, Rapid Fire, Momentum, Charm, Curse, Heal
   - Point cards (4 types): +1, +2, +3, +5 points with distribution weights

### Deliverables
- [ ] Project scaffolded and running
- [ ] All TypeScript types defined
- [ ] Constants file created
- [ ] Monster and card data files created

---

## Phase 2: Core Dice Mechanics

**Goal:** Implement the craps dice rolling system with all possible outcomes.

### Tasks

1. **Create dice utility functions** (`src/lib/dice.ts`)
   - `rollDice(count: number): number[]` - Roll N dice, return array of values
   - `sumDice(dice: number[]): number` - Sum dice values
   - `isNatural(sum: number): boolean` - Check for 7 or 11
   - `isCraps(sum: number): boolean` - Check for 2, 3, or 12
   - `isPoint(sum: number): boolean` - Check for 4, 5, 6, 8, 9, or 10
   - `isCrapOut(sum: number, point: number): boolean` - Check for 7 during point phase
   - `isEscapeRoll(sum: number): boolean` - Check for 2 during point phase

2. **Create come-out roll evaluation** (`src/lib/comeOutRoll.ts`)
   - `evaluateComeOutRoll(sum: number): ComeOutResult`
   - Returns: `{ type: 'natural' | 'craps' | 'point', pointValue?: number }`

3. **Create point phase roll evaluation** (`src/lib/pointPhaseRoll.ts`)
   - `evaluatePointPhaseRoll(sum: number, point: number, monsterNumbers: number[]): PointPhaseResult`
   - Returns: `{ type: 'hit' | 'point' | 'escape_offered' | 'crap_out' | 'miss', hitNumber?: number }`

4. **Create Dice component** (`src/components/Dice.tsx`)
   - Visual dice display with pip faces
   - Rolling animation support
   - Props: `values: number[]`, `rolling: boolean`

### Deliverables
- [ ] Dice utility functions with unit tests
- [ ] Come-out roll evaluation logic
- [ ] Point phase roll evaluation logic
- [ ] Dice UI component with animations

---

## Phase 3: Game State Management

**Goal:** Implement centralized game state with React Context.

### Tasks

1. **Create GameContext** (`src/context/GameContext.tsx`)
   - Define `GameState` with all game data
   - Define `GameActions` for state mutations
   - Implement `useGame()` hook for component access

2. **Implement core state actions**
   - `initializeGame(playerNames: string[])` - Set up new game
   - `setTurnPhase(phase: TurnPhase)` - Transition turn phases
   - `nextPlayer()` - Advance to next player's turn
   - `updatePlayer(playerId: string, updates: Partial<Player>)` - Modify player state
   - `updateMonster(updates: Partial<Monster>)` - Modify current monster state

3. **Implement game initialization logic** (`src/lib/gameInit.ts`)
   - Create player objects with starting gold
   - Shuffle and set up monster deck
   - Shuffle and set up marketplace
   - Initialize damage tracker

### Deliverables
- [ ] GameContext provider and hook
- [ ] All core state actions implemented
- [ ] Game initialization logic complete

---

## Phase 4: Monster System

**Goal:** Implement monster deck, monster state tracking, and damage persistence.

### Tasks

1. **Create monster state management**
   - Track current monster index (1-10)
   - Track remaining numbers on current monster
   - Store monster state before turn (for reset on crap-out)
   - Handle monster defeat and progression to next monster

2. **Implement monster damage tracking**
   - `hitMonsterNumber(number: number)` - Cross off a number
   - `hitPointNumber(chosenNumber: number)` - Player chooses number to remove
   - `isMonsterDefeated()` - Check if all numbers crossed off
   - `resetMonsterToTurnStart()` - Restore monster state on crap-out

3. **Create Monster component** (`src/components/Monster.tsx`)
   - Display monster name, type, stats
   - Show numbers grid with hit/remaining states
   - Victory animation on defeat
   - Props: `monster: Monster`, `highlightNumber?: number`

4. **Create MonsterGauntlet component** (`src/components/MonsterGauntlet.tsx`)
   - Show progress through 10 monsters
   - Highlight current monster
   - Show defeated monsters with who killed them

### Deliverables
- [ ] Monster state tracking in GameContext
- [ ] Monster damage/defeat logic
- [ ] Monster UI components

---

## Phase 5: Player System & Gold Economy

**Goal:** Implement player state, gold transactions, and victory point tracking.

### Tasks

1. **Implement gold transactions** (`src/lib/gold.ts`)
   - `addGold(player: Player, amount: number)` - Gain gold
   - `removeGold(player: Player, amount: number)` - Spend gold
   - `calculateCrapOutLoss(currentGold: number): number` - 50% rounded down
   - `canAfford(player: Player, cost: number): boolean` - Check purchase ability

2. **Implement victory point tracking**
   - `addVictoryPoints(player: Player, points: number)`
   - `checkVictory(player: Player): boolean` - Check if reached 10 points
   - `getWinner(players: Player[]): Player | null` - Check for winner

3. **Implement card hand management**
   - `addPermanentCard(player: Player, card: PermanentCard)`
   - `addSingleUseCard(player: Player, card: SingleUseCard)`
   - `useSingleUseCard(player: Player, cardId: string)`
   - `discardHand(player: Player)` - For revive mechanic
   - `canHoldPermanent(player: Player): boolean` - Check max 6
   - `canHoldSingleUse(player: Player): boolean` - Check max 8

4. **Create PlayerDashboard component** (`src/components/PlayerDashboard.tsx`)
   - Display player name, gold, victory points, damage
   - Show permanent cards in hand
   - Show single-use cards in hand
   - Highlight active player

5. **Create PlayerSetup component** (`src/components/PlayerSetup.tsx`)
   - Input player names (2-8 players)
   - Start game button
   - Player count validation

### Deliverables
- [ ] Gold transaction functions
- [ ] Victory point tracking
- [ ] Card hand management
- [ ] Player UI components

---

## Phase 6: Turn Flow - Phases 1-4

**Goal:** Implement marketplace refresh, purchases, card reveal, and betting phases.

### Tasks

1. **Implement Phase 1: Marketplace Refresh**
   - Check if player has 3+ gold
   - `refreshMarketplace()` - Discard and draw new cards
   - UI: Refresh button with cost display

2. **Implement Phase 2: Market Purchases**
   - Display available cards with costs
   - `purchaseCard(player: Player, card: Card)` - Buy card
   - Validate hand limits before purchase
   - Handle point card immediate addition

3. **Implement Phase 3: Card Reveal**
   - Display active player's cards to all players
   - Show permanent and single-use cards publicly

4. **Implement Phase 4: Betting Window**
   - `placeBet(playerId: string, type: 'FOR' | 'AGAINST', amount: number)`
   - Validate player has enough gold
   - Lock bets before rolling begins
   - `clearBets()` - Reset for next turn

5. **Create Marketplace component** (`src/components/Marketplace.tsx`)
   - Display 8-10 cards face-up
   - Purchase buttons with cost
   - Refresh button
   - Disable during other players' turns

6. **Create BettingPanel component** (`src/components/BettingPanel.tsx`)
   - FOR/AGAINST bet placement
   - Amount input
   - Display all active bets
   - Lock interface when rolling starts

### Deliverables
- [ ] Marketplace refresh logic
- [ ] Card purchase flow
- [ ] Betting system implementation
- [ ] UI components for phases 1-4

---

## Phase 7: Turn Flow - Come-Out Roll (Phase 5)

**Goal:** Implement the come-out roll phase with natural/craps/point outcomes.

### Tasks

1. **Implement come-out roll flow**
   - Player clicks "Roll" button
   - Dice animation plays
   - Evaluate result: natural, craps, or point

2. **Handle Natural (7 or 11)**
   - Monster defeated instantly
   - Award monster points and gold
   - Draw random card from power-up deck
   - Clear all bets (no one wins/loses)
   - End turn, advance to next monster

3. **Handle Craps (2, 3, 12)**
   - Player loses 50% gold
   - Player gains nothing
   - FOR bets lost, AGAINST bets doubled
   - End turn, next player faces same monster

4. **Handle Point Established (4, 5, 6, 8, 9, 10)**
   - Store point value
   - Transition to Point Phase
   - Update UI to show established point

5. **Create ComeOutRoll component** (`src/components/ComeOutRoll.tsx`)
   - Roll button
   - Dice display
   - Result announcement
   - Point indicator when established

### Deliverables
- [ ] Come-out roll execution
- [ ] Natural outcome handling
- [ ] Craps outcome handling
- [ ] Point establishment
- [ ] Come-out UI component

---

## Phase 8: Turn Flow - Point Phase (Phase 6)

**Goal:** Implement the point phase with all roll outcomes.

### Tasks

1. **Implement point phase roll loop**
   - Player rolls repeatedly until resolution
   - Track accumulated damage this turn

2. **Handle Monster Number Hit**
   - Cross off number from monster
   - FOR bets: Each bettor gains +1 gold
   - Add +1 to player's damage tracker
   - Continue rolling

3. **Handle Point Hit**
   - Player chooses any remaining monster number to remove
   - FOR bets: Each bettor gains +1 gold
   - Add +1 to player's damage tracker
   - Continue rolling

4. **Handle Escape Offer (Roll 2)**
   - Show escape/continue dialog
   - Escape: End turn, keep resources, gain nothing from turn
   - Continue: Resume rolling

5. **Handle Crap Out (Roll 7)**
   - Player loses 50% gold
   - Reset monster to pre-turn state
   - FOR bets lost, AGAINST bets doubled
   - Offer revive option (discard hand to continue)
   - End turn if no revive

6. **Handle Monster Defeated**
   - Award monster points and gold
   - Draw random card
   - Shooter collects AGAINST bets
   - Add turn damage to cumulative total
   - Advance to next monster

7. **Create PointPhase component** (`src/components/PointPhase.tsx`)
   - Dice roll button
   - Point indicator
   - Monster numbers display
   - Number selection UI (for point hits)
   - Escape dialog
   - Revive dialog

### Deliverables
- [ ] Point phase roll loop
- [ ] All roll outcome handlers
- [ ] Escape mechanic
- [ ] Revive mechanic
- [ ] Point phase UI component

---

## Phase 9: Betting Resolution

**Goal:** Implement complete betting payout system.

### Tasks

1. **Implement bet tracking**
   - Store accumulated gains per FOR bettor during point phase
   - Track AGAINST bet pool

2. **Implement payout functions** (`src/lib/betting.ts`)
   - `processComeOutNatural(bets: Bet[])` - All bets disappear
   - `processComeOutCraps(bets: Bet[], players: Player[])` - AGAINST doubled
   - `processPointPhaseHit(forBets: Bet[], players: Player[])` - FOR gains +1 each
   - `processMonsterDefeated(bets: Bet[], shooter: Player, players: Player[])` - Shooter gets AGAINST
   - `processCrapOut(bets: Bet[], players: Player[])` - AGAINST doubled

3. **Create BetResolution component** (`src/components/BetResolution.tsx`)
   - Show bet outcomes
   - Display gold transfers
   - Animation for payouts

### Deliverables
- [ ] Bet tracking during turn
- [ ] All payout scenarios implemented
- [ ] Bet resolution UI

---

## Phase 10: Damage Leader System

**Goal:** Implement damage tracking and +3 victory point card mechanics.

### Tasks

1. **Implement damage tracking**
   - Track cumulative damage per player
   - Add damage only on successful monster defeat (not on crap-out)
   - Store damage from point hits and point number hits

2. **Implement damage leader mechanics** (`src/lib/damageLeader.ts`)
   - `checkDamageLeader(players: Player[]): string | null` - Get leader ID
   - `shouldTransferLeaderCard(newDamage: number, currentLeader: Player): boolean`
   - Transfer only when SURPASSING (not tying)

3. **Create DamageTracker component** (`src/components/DamageTracker.tsx`)
   - Public leaderboard showing all players' damage
   - Highlight current damage leader
   - Show +3 card next to leader
   - Animation when card transfers

### Deliverables
- [ ] Damage tracking logic
- [ ] Leader card transfer mechanics
- [ ] Damage tracker UI

---

## Phase 11: Card Effects System

**Goal:** Implement all permanent and single-use card effects.

### Tasks

1. **Create card effect system** (`src/lib/cardEffects.ts`)
   - Effect registry mapping card IDs to effect functions
   - Timing system for when effects trigger

2. **Implement Permanent Card Effects**
   - `+1 Die` - Roll 3d6, pick best 2
   - `Reroll` - Reroll one die after seeing result
   - `Shield` - Block one 7 (negate crap-out once)
   - `Lucky` - Guarantee non-7 on next roll
   - `Armor` - Next crap-out doesn't lose gold
   - `Point Bonus` - Point hit removes 2 numbers
   - `Double` - Next monster hit counts as 2 hits

3. **Implement Single-Use Card Effects**
   - `Stun` - Monster takes turn off (skip to next player without rolling)
   - `Rapid Fire` - Roll twice this turn
   - `Momentum` - After 2 hits, gain +1 die for next roll
   - `Charm` - Get 2 consecutive turns
   - `Curse` - Target player's next roll treated as 7
   - `Heal` - Un-cross one number from monster

4. **Create CardEffectUI component** (`src/components/CardEffectUI.tsx`)
   - Display active effects
   - Card activation buttons
   - Target selection for curse/heal
   - Effect resolution animations

### Deliverables
- [ ] Card effect registry
- [ ] All permanent effects implemented
- [ ] All single-use effects implemented
- [ ] Card effect UI

---

## Phase 12: Victory & Game End

**Goal:** Implement victory conditions, tie-breakers, and game end flow.

### Tasks

1. **Implement victory checking** (`src/lib/victory.ts`)
   - Check after each turn for 10+ victory points
   - Include damage leader bonus in calculation
   - Handle multiple players reaching 10 on same round

2. **Implement tie-breaker logic**
   - Compare total victory points
   - If tied: Compare gold
   - If tied: Compare permanent card count
   - If still tied: Shared victory

3. **Implement game end conditions**
   - Primary: First to 10 points
   - Optional: Team wipe (all players crap out on same monster)

4. **Create GameOver component** (`src/components/GameOver.tsx`)
   - Winner announcement
   - Final scores display
   - Stats summary (monsters killed, damage dealt, gold earned)
   - Play again button

### Deliverables
- [ ] Victory checking after each turn
- [ ] Tie-breaker resolution
- [ ] Game end conditions
- [ ] Game over UI

---

## Phase 13: Main Game UI Integration

**Goal:** Assemble all components into cohesive game interface.

### Tasks

1. **Create main Game component** (`src/components/Game.tsx`)
   - Orchestrate all game phases
   - Manage component visibility based on turn phase
   - Handle turn transitions

2. **Create GameBoard component** (`src/components/GameBoard.tsx`)
   - Layout for monster, players, marketplace, dice
   - Responsive design for different screen sizes
   - Turn log sidebar

3. **Create TurnLog component** (`src/components/TurnLog.tsx`)
   - History of rolls and outcomes
   - Bet results
   - Card plays
   - Monster defeats

4. **Implement turn phase transitions**
   - Smooth animations between phases
   - Clear indicators of current phase
   - Timeout handling for betting phase

### Deliverables
- [ ] Main game orchestration
- [ ] Complete game board layout
- [ ] Turn log functionality
- [ ] Phase transitions

---

## Phase 14: Polish & UX

**Goal:** Add animations, sounds, and quality-of-life features.

### Tasks

1. **Add dice rolling animations**
   - 3D dice roll effect or 2D tumble animation
   - Satisfying landing animation
   - Result highlight

2. **Add visual feedback**
   - Gold gain/loss indicators (+5 / -3 floating numbers)
   - Victory point updates
   - Damage accumulation effects
   - Card glow effects

3. **Add sound effects** (optional)
   - Dice roll sounds
   - Victory/defeat jingles
   - Card play sounds
   - Betting chip sounds

4. **Add accessibility features**
   - Keyboard navigation
   - Screen reader support
   - Color-blind friendly design

5. **Add quality-of-life features**
   - Quick-bet buttons (1, 5, 10 gold)
   - Auto-roll toggle
   - Game speed settings
   - Undo last action (betting phase only)

### Deliverables
- [ ] Animations throughout
- [ ] Visual feedback system
- [ ] Optional sound effects
- [ ] Accessibility compliance
- [ ] QoL features

---

## Phase 15: Testing & Balance

**Goal:** Comprehensive testing and gameplay balance tuning.

### Tasks

1. **Unit testing**
   - Dice probability validation
   - Bet payout calculations
   - Card effect logic
   - Victory condition checking

2. **Integration testing**
   - Complete turn flow
   - State management
   - Edge cases (empty deck, max cards, etc.)

3. **Playtesting sessions**
   - 2-player balance
   - 4-player balance
   - 8-player balance
   - Time-to-completion tracking

4. **Balance tuning based on playtesting**
   - Card costs
   - Monster difficulty
   - Gold economy
   - Damage leader threshold

### Deliverables
- [ ] Unit test suite
- [ ] Integration test suite
- [ ] Playtest feedback documented
- [ ] Balance adjustments implemented

---

## Phase 16: Multiplayer Support (Optional)

**Goal:** Enable networked multiplayer gameplay.

### Tasks

1. **Evaluate multiplayer approach**
   - WebSocket server for real-time
   - Peer-to-peer with WebRTC
   - Turn-based with polling

2. **Implement game room system**
   - Create/join room
   - Room code sharing
   - Player list management

3. **Implement state synchronization**
   - Server-authoritative game state
   - Client state updates
   - Reconnection handling

4. **Add multiplayer UI**
   - Lobby screen
   - Waiting indicators
   - Disconnection handling

### Deliverables
- [ ] Multiplayer architecture chosen
- [ ] Room system implemented
- [ ] State sync working
- [ ] Multiplayer UI complete

---

## File Structure

```
src/
├── app/
│   ├── page.tsx              # Entry point
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
│
├── components/
│   ├── Game.tsx              # Main orchestrator
│   ├── GameBoard.tsx         # Layout component
│   ├── PlayerSetup.tsx       # Game initialization
│   ├── PlayerDashboard.tsx   # Player info display
│   ├── Monster.tsx           # Monster display
│   ├── MonsterGauntlet.tsx   # Monster progress
│   ├── Dice.tsx              # Dice display
│   ├── Marketplace.tsx       # Card shop
│   ├── BettingPanel.tsx      # Bet placement
│   ├── BetResolution.tsx     # Bet payouts
│   ├── ComeOutRoll.tsx       # Phase 5 UI
│   ├── PointPhase.tsx        # Phase 6 UI
│   ├── CardEffectUI.tsx      # Card activation
│   ├── DamageTracker.tsx     # Damage leaderboard
│   ├── TurnLog.tsx           # History display
│   └── GameOver.tsx          # End screen
│
├── context/
│   └── GameContext.tsx       # State management
│
├── lib/
│   ├── constants.ts          # Game constants
│   ├── dice.ts               # Dice utilities
│   ├── comeOutRoll.ts        # Come-out evaluation
│   ├── pointPhaseRoll.ts     # Point phase evaluation
│   ├── gold.ts               # Gold transactions
│   ├── betting.ts            # Bet processing
│   ├── damageLeader.ts       # Damage tracking
│   ├── cardEffects.ts        # Card effect system
│   ├── victory.ts            # Win condition checking
│   ├── gameInit.ts           # Game setup
│   ├── monsterDeck.ts        # Monster data
│   └── cardDeck.ts           # Card data
│
├── types/
│   └── game.ts               # TypeScript definitions
│
└── hooks/
    ├── useDiceRoll.ts        # Dice rolling hook
    ├── useBetting.ts         # Betting management hook
    └── useCardEffects.ts     # Card effect hook
```

---

## Estimated Timeline

| Phase | Description | Complexity |
|-------|-------------|------------|
| 1 | Project Foundation | Low |
| 2 | Core Dice Mechanics | Low |
| 3 | Game State Management | Medium |
| 4 | Monster System | Medium |
| 5 | Player System & Gold | Medium |
| 6 | Turn Phases 1-4 | Medium |
| 7 | Come-Out Roll | Medium |
| 8 | Point Phase | High |
| 9 | Betting Resolution | Medium |
| 10 | Damage Leader System | Low |
| 11 | Card Effects System | High |
| 12 | Victory & Game End | Low |
| 13 | Main UI Integration | Medium |
| 14 | Polish & UX | Medium |
| 15 | Testing & Balance | Medium |
| 16 | Multiplayer (Optional) | High |

---

## Open Implementation Decisions

1. **Card Pool Size:** Start with 15 permanent cards (multiple copies of 7 types), 10 single-use cards, 20 point cards as recommended in design doc

2. **Boss Mechanics:** Monster 10 should have special condition - proposal: must hit numbers in sequence, or all 7s blocked during boss fight

3. **Betting Caps:** Implement optional max bet of 5 gold to prevent early snowballing

4. **Simultaneous Betting:** All non-active players bet simultaneously with hidden amounts revealed together

5. **Card Draw Visibility:** Cards drawn are revealed immediately to all players

6. **Revive Limit:** Once per monster as specified in design doc

7. **Starting Hand:** Empty hand as specified (0 cards)

---

## Success Criteria

- [ ] Game plays smoothly for 2-8 players
- [ ] All victory paths are viable
- [ ] Average game length: 20-30 minutes
- [ ] Off-turn players remain engaged (betting, watching)
- [ ] UI is intuitive and responsive
- [ ] No game-breaking bugs or exploits
- [ ] Card effects work correctly and are balanced

---

## References

- [Game Design Document](./GAME_DESIGN_DOC.md) - Full game rules and mechanics
- [Craps Rules](https://en.wikipedia.org/wiki/Craps) - Reference for dice mechanics

---

*Document Version: 1.0*
*Last Updated: 2026-01-31*
