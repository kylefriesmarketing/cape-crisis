# CAPE // CRISIS
An original superhero versus alien twin-stick survival shooter inspired by the chaotic short-session spirit of I MAED A GAM3 W1TH Z0MB1ES 1N IT!!!1. No original game's code, characters, art, music, or lyrics are used.
Reference: https://store.steampowered.com/app/1800730/I_MAED_A_GAM3_W1TH_Z0MB1ES_1N_IT1/

## Play
Choose Solar (photon bolts / supernova), Volt (chain lightning / chain reaction), or Atlas (spread punch / meteor strike). Choose Chill, Arcade, or Chaos. Survive five minutes, then destroy the mothership. Four chapter breaks offer a permanent upgrade. A heavy boss arrives midway.
- WASD moves. Mouse + hold left click aims and fires. Arrow keys also aim and fire.
- Space / Shift dashes; E / Q spends a full super meter.
- Escape / P pauses. Switching away automatically pauses.
- Controller: left stick moves, right stick shoots, A / LB dashes, X / RB unleashes super, Menu pauses/resumes.
- Touch: independent left movement and right aim sticks; on-screen dash/super. Landscape recommended.
- Local co-op: P1 keyboard/mouse, P2 first gamepad. Stand within the revive marker for 2.5 seconds to revive a teammate.
- Settings provide auto aim/fire, music, effects, and screen shake toggles.

Score and preferences stay on this device. No account, leaderboard service or online multiplayer is built into the game. Sites owner authentication protects the private hosted version.

## Development
Use Node 22.13+ and npm. Run npm install, npm run dev, npm test, npm run build.
- app/page.jsx: menu, HUD, dialogs and game lifecycle
- app/globals.css: comic-book theme and responsive layout
- game/engine.mjs: pure seeded simulation, collisions, AI, chapters, bosses, upgrades
- game/render.mjs: canvas world and entity rendering
- game/input.mjs: keyboard, mouse, multi-touch and standard Gamepad API
- game/audio.mjs: original Web Audio synth-rock and sound effects
- tests/: movement, combat, pickups, powers, co-op, transitions, full-run soaks, renderer call checks, soundtrack scheduling, and input mappings

Build uses the generated Vinext/Sites scaffold. The source repository is scoped only to this directory. Hosting identity is in .openai/hosting.json. Use the Sites workflow for publication; never run the Age of Toys deployment script for this game.

## Validation
24 automated checks pass, including three 330-second combat soaks with damage suppressed to reach every chapter. These check runtime state and mechanics, not human difficulty balance. Renderer calls are validated with a canvas mock; input mappings use simulated keyboard, pointer and gamepad events. Physical controllers, device touch and visual browser playtesting have not been performed.
A feature-detected WebMCP surface reads game status and pauses/resumes. No supported WebMCP validation context was available; those optional tools are not claimed as verified.
Artwork was generated once as an original title-screen illustration. Combat art is runtime Canvas rendering. Audio is synthesized locally and starts after player interaction.

## Design limits
One arena with six music/invasion chapters, six alien grunt types, two bosses, four temporary weapon pickups, six permanent upgrades, three heroes, and local two-player co-op. The viewport letterboxes the full battlefield so all players share the arena. The engine uses fixed 60 Hz updates, a spatial grid for projectile collision, bounded enemy and particle counts, and swept projectile tests.

## Issue 02 — Supercharged
- Signature dash attacks: Solar burns through a line; Volt shocks a wider area and erases shots; Atlas deals heavy damage and knockback. Each dash hits a target once.
- Gunfire pushes smaller enemies back. Impact pauses, hit sounds, dash trails, and temporary alien marks make combat easier to feel and read. Reduced-motion/screen-shake preferences disable impact pauses.
- Bosses alternate attacks: the Warden uses shockwaves and charger reinforcements; the Mothership uses a marked orbital laser and bombardments. Both enrage at half health. Warnings lock before firing.
- Chapter timeline, combo decay bar, nearby pickup names, weapon duration bars, opening control hints, and end-of-run upgrade recap.
- Controller navigation covers hero/difficulty selection, co-op toggle, upgrades, pause actions, settings, and results. Held confirm inputs do not automatically select an upgrade or dash after returning.
- Fixes: co-op pickups follow the nearest living hero; recovery upgrades revive safely; end states lock scoring; controller aim stays in place when the stick returns to center.
