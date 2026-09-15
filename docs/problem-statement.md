# Problem Statement

## Background

Global supply chains depend critically on container port terminals handling thousands of twenty-foot equivalent units (TEUs) every day. As exemplified by historic bottlenecks like the 2021 Los Angeles/Long Beach harbor crisis ($10B+ in stranded economic value), container ports face volatile vessel arrival streams, fluctuating tidal windows, finite berth quay lines, and unpredictable equipment breakdowns.

## The Problem

Port dispatch supervisors and harbor masters currently rely on disconnected spreadsheets, VHF radio coordination, and naive **First-Come, First-Served (FCFS)** scheduling algorithms. In this reactive operating model:
- Urgent, refrigerated, and high-value cargo ships queue behind slow-discharge bulk vessels.
- Equipment outages (such as Ship-to-Shore crane hydraulic failures) cause cascading queue backlogs across entire terminals.
- Congestion spikes and outer anchorage dwell times remain hidden until vessels have already arrived in harbor waters.
- Operations teams lack safe, non-destructive tools to evaluate "what-if" disruption scenarios before committing tactical shift directives.

## Who is Affected

- **Harbor Masters & Port Operations Directors**: Responsible for overall harbor throughput, berth utilization, and demurrage exposure.
- **Port Dispatchers & Shift Supervisors**: Frontline personnel assigning vessel docking slots, STS crane gangs, and tug assistance.
- **Shipping Lines & Carrier Operators (e.g., Maersk, MSC, COSCO)**: Subject to thousands of dollars per hour in demurrage penalties and fuel waste while idling at outer anchorage.

## Why It Matters

- **Financial Impact**: Port congestion costs carriers and terminal operators upwards of **$180,000+ in demurrage and idle costs per day** during peak bottlenecks.
- **Supply Chain Delays**: Vessel wait times exceeding 7+ hours ripple through intermodal rail and trucking networks, causing retail shortages and factory delays.
- **Environmental Impact**: Idle container carriers burn bunker fuel while waiting at outer anchorage, driving up unnecessary carbon emissions.

## Why Existing Solutions Fall Short

Traditional Port Management Information Systems (PMIS) are passive record-keeping databases. They lack:
1. **Explainable 72-hour predictive congestion modeling** across multi-terminal horizons.
2. **Dynamic priority-aware berth and crane optimization** that automatically reroutes vessels to balance terminal loads.
3. **In-memory contingency simulation** to test equipment failures without corrupting persisted schedule data.
4. **Interactive AI Copilots** that translate raw telemetry into actionable shift orders.
