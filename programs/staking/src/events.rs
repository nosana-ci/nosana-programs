use anchor_lang::prelude::*;

#[event]
pub struct Price {
    pub nos_per_xnos_e6: u64,
    pub nos_per_xnos: String,
}
