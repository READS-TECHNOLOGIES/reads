import os
import hashlib
from pycardano import (
    Address, 
    Network, 
    PaymentSigningKey, 
    PaymentVerificationKey
)
from cryptography.fernet import Fernet
from typing import Tuple

# --- Environment Configuration ---
# Use a strong key derived from your main SECRET_KEY for encryption
# We hash it to guarantee a 32-byte key required by Fernet.
SECRET_KEY_BASE = os.getenv("SECRET_KEY", "your-default-insecure-key")
ENCRYPTION_KEY = hashlib.sha256(SECRET_KEY_BASE.encode('utf-8')).digest()

try:
    fernet = Fernet(ENCRYPTION_KEY)
except ValueError:
    # Fallback/Error handling for an invalid key length if SECRET_KEY is somehow messed up
    # This shouldn't happen with the hashlib.sha256 approach, but it's good practice.
    print("FATAL ERROR: Could not initialize Fernet. Check SECRET_KEY environment variable.")
    fernet = None


def generate_and_encrypt_cardano_wallet() -> Tuple[str, str]:
    """
    Generates a new Cardano key pair, derives a Testnet address (Preview/Preprod), 
    and encrypts the payment signing key (private key).

    Returns:
        Tuple[cardano_address, encrypted_skey_hex_string]
    """
    if not fernet:
        return "", ""

    try:
        # 1. Generate Signing and Verification Keys (Public/Private Pair)
        payment_signing_key = PaymentSigningKey.generate()
        payment_verification_key = PaymentVerificationKey.from_signing_key(payment_signing_key)

        # 2. Derive Testnet Address
        # Network.TESTNET maps to one of the current public Cardano test networks (Preview/Preprod).
        address = Address(
            payment_part=payment_verification_key.hash(), 
            network=Network.TESTNET
        )

        # 3. Serialize Private Key (SKey) to Bytes
        skey_bytes = payment_signing_key.to_bytes()
        
        # 4. Encrypt the Private Key
        encrypted_skey_bytes = fernet.encrypt(skey_bytes)
        
        print(f"INFO: Generated Cardano Testnet address: {str(address)}")

        # Return the public address and the encrypted key as a hex string for database storage
        return str(address), encrypted_skey_bytes.hex()
        
    except Exception as e:
        print(f"FATAL ERROR: Failed to generate Cardano wallet: {e}")
        return "", ""

def decrypt_skey(encrypted_skey_hex: str) -> PaymentSigningKey:
    """
    Decrypts the stored signing key hex string back into a PyCardano object.
    (Utility for future transaction signing module).
    """
    if not fernet:
        raise Exception("Encryption utility not initialized.")
        
    encrypted_skey_bytes = bytes.fromhex(encrypted_skey_hex)
    skey_bytes = fernet.decrypt(encrypted_skey_bytes)
    return PaymentSigningKey.from_bytes(skey_bytes)
