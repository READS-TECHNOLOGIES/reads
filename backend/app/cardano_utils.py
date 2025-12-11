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
import traceback # Added for detailed error logging

# --- Environment Configuration ---
SECRET_KEY_BASE = os.getenv("SECRET_KEY", "your-default-insecure-key")
ENCRYPTION_KEY = hashlib.sha256(SECRET_KEY_BASE.encode('utf-8')).digest()

fernet = None
try:
    fernet = Fernet(ENCRYPTION_KEY)
except ValueError as e:
    print(f"FATAL ERROR: Could not initialize Fernet. Check SECRET_KEY environment variable. Error: {e}")


def generate_and_encrypt_cardano_wallet() -> Tuple[str, str]:
    """
    Generates a new Cardano key pair, derives a Preprod Testnet address, 
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
        # 🟢 CRITICAL FIX: Explicitly using Network.TESTNET_PREPROD to match user's Blockfrost key
        address = Address(
            payment_part=payment_verification_key.hash(), 
            network=Network.TESTNET_PREPROD 
        )

        # 3. Serialize Private Key (SKey) to Bytes
        skey_bytes = payment_signing_key.to_bytes()

        # 4. Encrypt the Private Key
        encrypted_skey_bytes = fernet.encrypt(skey_bytes)

        # Successfully generated, return address and encrypted key
        return str(address), encrypted_skey_bytes.hex()

    except Exception as e:
        # 🚨 Logging the full stack trace to help debug if the issue persists
        print("--- CARDANO WALLET GENERATION FAILED ---")
        print(f"FATAL ERROR: Failed to generate Cardano wallet: {e}")
        traceback.print_exc() 
        print("------------------------------------------")
        return "", ""

def decrypt_skey(encrypted_skey_hex: str) -> PaymentSigningKey:
    """
    Decrypts the stored signing key hex string back into a PyCardano object.
    """
    if not fernet:
        raise Exception("Encryption utility not initialized.")

    encrypted_skey_bytes = bytes.fromhex(encrypted_skey_hex)
    skey_bytes = fernet.decrypt(encrypted_skey_bytes)
    return PaymentSigningKey.from_bytes(skey_bytes)
