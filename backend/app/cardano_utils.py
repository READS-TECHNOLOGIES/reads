import os
import hashlib
from typing import Tuple
import traceback # Ensure this is imported

try:
    # 🚨 CRITICAL CHECK: Ensure PyCardano and its crypto dependencies are loaded
    from pycardano import (
        Address, 
        Network, 
        PaymentSigningKey, 
        PaymentVerificationKey
    )
    from cryptography.fernet import Fernet
    CRYPTO_READY = True
except ImportError as e:
    # This will be printed if pycardano or cryptography failed to load
    print(f"FATAL SETUP ERROR: Missing required crypto modules: {e}")
    CRYPTO_READY = False
except Exception as e:
    # Catch any other initialization errors
    print(f"FATAL SETUP ERROR: General initialization failed: {e}")
    CRYPTO_READY = False

# --- Environment Configuration ---
SECRET_KEY_BASE = os.getenv("SECRET_KEY", "your-default-insecure-key")
ENCRYPTION_KEY = hashlib.sha256(SECRET_KEY_BASE.encode('utf-8')).digest()

fernet = None
if CRYPTO_READY:
    try:
        fernet = Fernet(ENCRYPTION_KEY)
    except ValueError as e:
        print(f"FATAL ERROR: Could not initialize Fernet. Check SECRET_KEY environment variable. Error: {e}")


def generate_and_encrypt_cardano_wallet() -> Tuple[str, str]:
    """
    Generates a new Cardano key pair, derives a Preprod Testnet address, 
    and encrypts the payment signing key (private key).
    """
    # 🛑 Bail out if setup failed
    if not CRYPTO_READY or not fernet:
        print("WARNING: Wallet generation bypassed due to setup error.")
        return "", ""

    try:
        # 1. Generate Signing and Verification Keys
        payment_signing_key = PaymentSigningKey.generate()
        payment_verification_key = PaymentVerificationKey.from_signing_key(payment_signing_key)

        # 2. Derive Testnet Address (Preprod)
        address = Address(
            payment_part=payment_verification_key.hash(), 
            network=Network.TESTNET_PREPROD 
        )

        # 3. Serialize & Encrypt the Private Key
        skey_bytes = payment_signing_key.to_bytes()
        encrypted_skey_bytes = fernet.encrypt(skey_bytes)
        
        # Success!
        return str(address), encrypted_skey_bytes.hex()

    except Exception as e:
        # 🚨 Use traceback to catch any error during generation
        print("--- CARDANO WALLET GENERATION FAILED (RUNTIME) ---")
        print(f"FATAL ERROR: Failed to generate Cardano wallet: {e}")
        traceback.print_exc() 
        print("------------------------------------------")
        return "", ""

def decrypt_skey(encrypted_skey_hex: str) -> PaymentSigningKey:
    # ... (rest of the decrypt_skey function remains the same)
    if not fernet:
        raise Exception("Encryption utility not initialized.")

    encrypted_skey_bytes = bytes.fromhex(encrypted_skey_hex)
    skey_bytes = fernet.decrypt(encrypted_skey_bytes)
    return PaymentSigningKey.from_bytes(skey_bytes)
