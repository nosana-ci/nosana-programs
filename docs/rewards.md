## Nosana Rewards Program

The rewards program allow stakers to earn rewards. Anyone that has a stake can
enter the rewards program.

These are some of the properties of the rewards program:

- A stakers' xNOS score determines the portion of the fees a user will receive.
- You have to explicietly `enter` the rewards program to participate. The rewards
  you receive are the percentage of your xNOS from all the participants.
- Everytime a fee is added to the program it is distributed to all the current
  participants.
- The program uses a token reflection model to distribute: fees are accounted
  for "live" as they come in and no loops necessary.
- Anyone can send in new fees to be distrubted using `add_fees`.
- You can `claim` your earned rewards at any time (does not require an
  unstake).
- If you `unstake` your reward account is voided. It is _very_ important that
  you claim rewards before unstaking.
- If you `upstake` or `extend` a stake your rewards program is not updated. You
  will have to `claim` upate your reward to make use of your new xNOS score.
- A user can only have 1 active rewards entry at a time
- The rewards a user earns are automatically added to the percentage of rewards
  he receives. Earned rewards are basically added to his xNOS score (with
  multiplier 1) - but can be claimed without any delay. This gives them a small
  advantage but is also a nice feature. Also it should be easy to `upstake` your
  rewards directly to get a higher multiplier for them.
- One can always close their own reward account. If the account has any
  unclaimed rewards they will be voided (distributed to all other participants).
- If a user unstaked anyone is allowed to close their reward account. This way
  there will not be "ghosts" accounts accumulating rewards.
