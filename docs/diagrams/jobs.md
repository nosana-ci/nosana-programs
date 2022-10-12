## Diagram

### Instruction Diagram

```mermaid
flowchart TB

    project --  recover -->  job
    project --  list    ---  market
    market  --  list    -->  job
    market  --  list    -->  run
    project -.- nos1    -.-> vault
    vault   -.- nos2    -.-> node
    project -.- nos3    -.-> fee

    node -- stop  --> market
    node -- work  --- market -- work  --> run
    node -- claim --- run    -- claim --> job
    node -- finish --- run    -- finish --> job
    node -- quit  --- run    -- quit --> job

    admin -- open   --> market
    admin -- update --> market
    admin -- close  --> market

    all -- clean --> job

    all(Everybody)
    node(Worker Node)
    project(Software Project)
    admin(Administrator)
    fee(Network Fees)

    nos1[NOS]
    nos2[NOS]
    nos3[NOS]

    market{Market Account}
    job{Job Account}
    run{Run Account}
    vault{Vault Account}

    classDef orange fill:#f96,stroke:#333,stroke-width:3px;
    classDef yellow fill:#ff7,stroke:#333,stroke-width:2px;

    class market,job,vault,run orange
    class nos1,nos2,nos3 yellow
```

### Queue Diagrams

Below a representation of the functioning for the different [QueueTypes](#queue-type).

::: tabs

@tab Node Queue
#### Node

When there a more nodes than jobs in a given Market, the queue will fill up with nodes.
The [`QueueType`](#queue-type) will be `Node` in this case.

```mermaid
flowchart TB
    subgraph Market
        market
        node
        project
        subgraph Queue
            order1 --> order2 --> order3
        end
    end

    node --> Queue
    order3 --> run
    project --> run

    node(Worker Node)
    project(Software Project)
    order1{Node}
    order2{Node}
    order3{Node}
    run{Run Account}
    market[Job Price<br>Job Timeout<br>Job Type<br>Job Expiration<br>Node Access Key<br>Node Minimum Stake]

    classDef orange fill:#f96,stroke:#333,stroke-width:3px;
    classDef yellow fill:#ff7,stroke:#333,stroke-width:2px;
    classDef grey fill:#BFC9CA,stroke:#333,stroke-width:2px;

    class order1,order2,order3 orange;
    class run yellow;
    class market grey;
```

@tab Job Queue
#### Job Queue

Vise versa, When there a more jobs than nodes in a given Market, the queue will fill up with jobs.
The [`QueueType`](#queue-type) will be `Job` in this case.

```mermaid
flowchart TB
    subgraph Market
        market
        node
        project
        subgraph Queue
            order1 --> order2 --> order3
        end
    end

    vault
    project --> Queue
    project --> vault
    order3 --> run
    node --> run

    node(Worker Node)
    project(Software Project)
    order1{Job}
    order2{Job}
    order3{Job}
    vault{Vault}
    run{Run Account}
    market[Job Price<br>Job Timeout<br>Job Type<br>Job Expiration<br>Node Access Key<br>Node Minimum Stake]

    classDef blue fill:#0083B1,stroke:#333,stroke-width:3px;
    classDef yellow fill:#ff7,stroke:#333,stroke-width:2px;
    classDef grey fill:#BFC9CA,stroke:#333,stroke-width:2px;
    class order1,order2,order3 blue;
    class run,vault yellow;
    class market grey;
```

@tab Empty Queue
#### Empty Queue

Finally, at the point when the market is satisfied, the queue will be empty.
The [`QueueType`](#queue-type) will be `Unknown` in this case.

```mermaid
flowchart TB
    subgraph Market
        node
        project
        market
        subgraph Queue
            order
        end
    end

    node --> Queue
    project --> Queue

    node(Worker Node)
    project(Software Project)
    order{Order}
    market[Job Price<br>Job Timeout<br>Job Type<br>Job Expiration<br>Node Access Key<br>Node Minimum Stake]

    classDef purple fill:#FC33FF,stroke:#333,stroke-width:3px;
    classDef grey fill:#BFC9CA,stroke:#333,stroke-width:2px;
    class order purple;
    class market grey;
```

:::
