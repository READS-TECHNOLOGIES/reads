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
# This prevents the initial ValueError you had before.
SECRET_KEY_BASE = os.getenv("SECRET_KEY", "your-default-insecure-key")
ENCRYPTION_KEY = hashlib.sha256(SECRET_KEY_BASE.encode('utf-8')).digest()

fernet = None
try:
    fernet = Fernet(ENCRYPTION_KEY)
except ValueError as e:
    # Log the specific error during initialization
    print(f"FATAL ERROR: Could not initialize Fernet. Check SECRET_KEY environment variable. Error: {e}")


def generate_and_encrypt_cardano_wallet() -> Tuple[str, str]:
    """
    Generates a new Cardano key pair, derives a Testnet address (Preview/Preprod), 
    and encrypts the payment signing key (private key).

    Returns:
        Tuple[cardano_address, encrypted_skey_hex_string]
    """
    if not fernet:
        # The main app handles this as a warning if it returns "", ""
        return "", ""

    try:
        # 1. Generate Signing and Verification Keys (Public/Private Pair)
        payment_signing_key = PaymentSigningKey.generate()
        payment_verification_key = PaymentVerificationKey.from_signing_key(payment_signing_key)

        # 2. Derive Testnet Address
        # CRITICAL FIX: Explicitly use Network.TESTNET_PREVIEW to match common Blockfrost usage
        # This reduces ambiguity compared to Network.TESTNET.
        address = Address(
            payment_part=payment_verification_key.hash(), 
            network=Network.TESTNET_PREVIEW 
        )

        # 3. Serialize Private Key (SKey) to Bytes
        skey_bytes = payment_signing_key.to_bytes()

        # 4. Encrypt the Private Key
        encrypted_skey_bytes = fernet.encrypt(skey_bytes)

        # print(f"INFO: Generated Cardano Testnet address: {str(address)}") # Disabled for clean log

        # Return the public address and the encrypted key as a hex string for database storage
        return str(address), encrypted_skey_bytes.hex()

    except Exception as e:
        # Log this FATAL error which triggers the warning in main.py
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
