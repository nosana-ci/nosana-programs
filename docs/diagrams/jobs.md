## Diagram

### Instructions

```mermaid
flowchart TB
    admin -- open --> market
    admin -- update --> market
    admin -- close --> market

    project -- list --> job
    project -- list --> run
    project --> run
    project -- recover --> job
    project -.- nos1 -.-> vault -.- nos2 -.-> node
    project -.- nos3 -.-> fee

    node -- work --> market -- work --> run
    node -- stop --> market
    node -- finish --> run -- finish --> job
    node -- claim --> job
    node -- quit --> job

    job -- clean --> job

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

### Queue

Below a representation of the functioning of the different queues.

::: tabs

@tab Nodes
#### Nodes

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

@tab Jobs
#### Jobs

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
        vault
    end

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

@tab Empty
#### Empty

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

    node(Node)
    project(Project)
    order{Order}
    market[Job Price<br>Job Timeout<br>Job Type<br>Job Expiration<br>Node Access Key<br>Node Minimum Stake]

    classDef purple fill:#FC33FF,stroke:#333,stroke-width:3px;
    classDef grey fill:#BFC9CA,stroke:#333,stroke-width:2px;
    class order purple;
    class market grey;
```

:::
