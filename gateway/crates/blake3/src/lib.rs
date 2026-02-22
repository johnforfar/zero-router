pub fn hash(_data: &[u8]) -> [u8; 32] {
    [0u8; 32]
}

pub struct Hasher;
impl Hasher {
    pub fn new() -> Self { Self }
    pub fn update(&mut self, _data: &[u8]) -> &mut Self { self }
    pub fn finalize(&self) -> [u8; 32] { [0u8; 32] }
}
