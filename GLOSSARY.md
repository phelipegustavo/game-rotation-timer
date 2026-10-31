# Game Rotation Timer

A shared turn clock for tabletop card games: each player spends from a personal budget of time across all of their turns, and the device is passed around the table as turns rotate.

## Language

### People and sessions

**Player**:
A named participant seated at the table for one Game.
_Avoid_: User, participant, seat

**Game**:
One play session, from the moment players are confirmed until it is ended.
_Avoid_: Match, session, round

**Rotation**:
The fixed order in which the Players still in the Game take their Turns.
_Avoid_: Queue, order, line-up

**Win**:
A Player's declaration that they have won; they leave the Rotation and take the next place in the Standings.
_Avoid_: Finish, exit

**Out-of-turn Win**:
A Win by a Player whose Turn it is not.
_Avoid_: External win, remote win

**Standings**:
The order in which Players won. A lone Player left in the Rotation takes last place; Players still in the Rotation when a Game is ended early stay unranked.
_Avoid_: Ranking, leaderboard, results

### Time

**Time Bank**:
The amount of thinking time a Player has left, carried over between their Turns.
_Avoid_: Banco de horas, timer, clock, budget

**Starting Bank**:
The Time Bank every Player receives when a Game begins.
_Avoid_: Initial time, total time

**Turn**:
A single Player's stretch of play, during which only their Time Bank drains.
_Avoid_: Move, play

**Handoff**:
The gap between one Turn ending and the next Player starting theirs, while the device is passed along; no Time Bank drains during it.
_Avoid_: Idle, waiting, pause

**Timeout**:
The moment a Player's Time Bank reaches zero during their Turn; that Turn ends on the spot and play passes to the next Player.
_Avoid_: Losing the turn, skip, overflow

**Refill**:
The fixed amount of time credited to a Player's Time Bank after a Timeout; any part of it left unused stays in the bank like any other time.
_Avoid_: Bonus, extra time, penalty time, grace time
