# Packet Patrol

A browser-based cybersecurity game built with AI assistance for a one-day computer science prototype. Protect a simulated network while keeping legitimate users connected.

## Run

Open `index.html` in a browser. No installation, account, API key, or build step is required. Open this folder in Visual Studio Code to edit it.

Optional local server: run `python3 -m http.server 8765 --bind 127.0.0.1` in this folder, then visit http://127.0.0.1:8765.

## Play

Start the mission, inspect packets, and add firewall block rules. There are three 45-second waves. Pause to think, inspect, or edit rules. Closing an inspection dialog does not automatically resume the mission. Rules persist across waves. Reset starts a clean mission.

Win by finishing all waves with integrity above zero and at least 70% legitimate-traffic delivery. A blocked threat scores +20; a legitimate delivery scores +5. A false block costs 25 points. A leaked threat costs 30 points and 6 integrity. Integrity does not recover. Personal best is saved locally when browser storage is available.

## Computer science concepts

- Packet metadata: source IP, destination IP, port, and transport protocol.
- Boolean logic: conditions within a rule use AND; separate blocking rules use OR.
- Filtering, arrays, objects, event handlers, and state transitions.
- Cybersecurity tradeoffs: false positives, availability, and precise access rules.

The app is a simulation, not a real firewall. Threat labels and fixed hostile sources are teaching aids. No packets are sent to the displayed addresses. All public-looking addresses are from documentation ranges. A real firewall would need evidence and policies beyond the simplified labels used here. Packet animation routes are illustrative.

## Files

- `index.html`: interface and network diagram
- `style.css`: responsive visual design
- `engine.js`: rule matching, packet generation, scoring
- `app.js`: simulation loop, interface, inspection, and missions
- `test-engine.js`: automated logic checks

Run `node test-engine.js` to verify rule matching, scoring, validation, and all wave scenarios.

## Manual testing checklist

1. Start, pause, resume, and reset a mission. Pausing should freeze the clock and traffic.
2. Inspect a threat; use its source in the rule builder; deploy the rule; resume.
3. Enter an invalid address and a duplicate rule; both should be rejected.
4. Delete a rule and confirm later packets can pass again.
5. Try blocking all TCP/443. Observe the legitimate delivery penalty.
6. In wave 3, compare blocking all of 192.0.2.88 against blocking that source only on TCP/22.
7. Complete a mission with precise rules; retry with no rules and observe the failure state.
8. Try a narrow browser window and keyboard navigation.

## Assignment follow-through

Ask a classmate or teacher to test the game. Record their actual feedback and make a refinement. Submit the source through your own GitHub portfolio. Record the time you actually spent working with AI; this project's creation does not by itself establish that you completed 45 minutes. Write reflections based on your experience.

Possible extension: add rate-limiting rules, explainable unknown threats, or a custom scenario editor.
