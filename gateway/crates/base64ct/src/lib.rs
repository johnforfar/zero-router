pub struct Base64;
impl Base64 {
    pub fn encode_string(_bytes: &[u8]) -> String { String::new() }
    pub fn decode_vec(_s: &str) -> Result<Vec<u8>, ()> { Ok(Vec::new()) }
}

pub trait Encoding {
    fn encode_string(_bytes: &[u8]) -> String { String::new() }
}
