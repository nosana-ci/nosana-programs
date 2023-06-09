/***
 * Types
 */

/// The `QueueType` describes the type of queue
#[repr(u8)]
pub enum ArchitectureType {
    // https://github.com/docker-library/official-images#architectures-other-than-amd64
    Amd64 = 0,        // Linux x86-64
    Arm32v6 = 1,      // ARMv6 32-bit
    Arm32v7 = 2,      // ARMv7 32-bit
    Arm64v8 = 3,      // ARMv8 64-bit
    WindowsAmd64 = 4, // Windows x86-64
    Ppc64le = 5,      // IBM POWER8
    S390x = 6,        // IBM z Systems
    Mips64le = 7,     // MIPS64 LE
    Riscv64 = 8,      // RISC-V 64-bit
    I386 = 9,         // x86/i686
    Unknown = 255,
}

impl From<u8> for ArchitectureType {
    fn from(architecture_type: u8) -> Self {
        match architecture_type {
            0 => ArchitectureType::Amd64,
            1 => ArchitectureType::Arm32v6,
            2 => ArchitectureType::Arm32v7,
            3 => ArchitectureType::Arm64v8,
            4 => ArchitectureType::WindowsAmd64,
            5 => ArchitectureType::Ppc64le,
            6 => ArchitectureType::S390x,
            7 => ArchitectureType::Mips64le,
            8 => ArchitectureType::Riscv64,
            9 => ArchitectureType::I386,
            _ => ArchitectureType::Unknown,
        }
    }
}
