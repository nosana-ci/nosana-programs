/***
 * Types
 */

/// The `QueueType` describes the type of queue
#[repr(u8)]
pub enum QueueType {
    Job = 0,
    Node = 1,
    Empty = 255,
}

impl From<u8> for QueueType {
    fn from(queue_type: u8) -> Self {
        match queue_type {
            0 => QueueType::Job,
            1 => QueueType::Node,
            _ => QueueType::Empty,
        }
    }
}

/// The `JobState` describes the status of a job.
#[repr(u8)]
pub enum JobState {
    Queued = 0,
    Running = 1,
    Done = 2,
    Stopped = 3,
}

/// The `JobType` describes the type of any job.
#[repr(u8)]
pub enum JobType {
    Default = 0,
    Small = 1,
    Medium = 2,
    Large = 3,
    Gpu = 4,
    Unknown = 255,
}

impl From<u8> for JobType {
    fn from(job_type: u8) -> Self {
        match job_type {
            0 => JobType::Default,
            1 => JobType::Small,
            2 => JobType::Medium,
            3 => JobType::Large,
            4 => JobType::Gpu,
            _ => JobType::Unknown,
        }
    }
}
