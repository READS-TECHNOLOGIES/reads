from __future__ import annotations

import os
import hashlib
from typing import Tuple, Optional, Any
import traceback 
import sys

# --- Pre-declare types to avoid NameError ---
PaymentSigningKey: Optional[Any] = None
PaymentVerificationKey: Optional[Any] = None
Address: Optional[Any] = None
Network: Optional[Any] = None
Fernet: Optional[Any] = None

CRYPTO_READY = False
IMPORT_ERROR_MESSAGE = ""

print("=" * 80)
print("🔧 CARDANO UTILS INITIALIZATION STARTING")
print("=" * 80)
print(f"Python version: {sys.version}")
print(f"Platform: {sys.platform}")

try:
    print("\n📦 Attempting to import pycardano...")
    from pycardano import (
        Address, 
        Network, 
        PaymentSigningKey, 
        PaymentVerificationKey
    )
    print("✅ pycardano imported successfully")
    
    print("\n📦 Attempting to import cryptography.fernet...")
    from cryptography.fernet import Fernet
    print("✅ cryptography.fernet imported successfully")
    
    CRYPTO_READY = True
    print("\n✅ ALL CRYPTO MODULES LOADED SUCCESSFULLY")
    
except ImportError as e:
    IMPORT_ERROR_MESSAGE = f"Missing module: {e}"
    print(f"\n❌ IMPORT ERROR: {IMPORT_ERROR_MESSAGE}")
    traceback.print_exc()
    
except Exception as e:
    IMPORT_ERROR_MESSAGE = f"Initialization failed: {e}"
    print(f"\n❌ GENERAL ERROR: {IMPORT_ERROR_MESSAGE}")
    print(f"Error type: {type(e).__name__}")
    traceback.print_exc()

print("=" * 80)
print(f"CRYPTO_READY: {CRYPTO_READY}")
print("=" * 80 + "\n")


# --- Environment Configuration ---
SECRET_KEY_BASE = os.getenv("SECRET_KEY", "your-default-insecure-key")

fernet = None
if CRYPTO_READY and Fernet:
    try:
        print("🔐 Initializing Fernet encryption...")
        from cryptography.fernet import Fernet as FernetClass
        import base64
        
        # Fernet requires base64-encoded 32-byte key
        key = hashlib.sha256(SECRET_KEY_BASE.encode('utf-8')).digest()
        encoded_key = base64.urlsafe_b64encode(key)
        fernet = FernetClass(encoded_key)
        
        print(f"✅ Fernet encryption initialized")
        print(f"   Key length: {len(key)} bytes")
        
    except ValueError as e:
        print(f"❌ Fernet initialization failed (ValueError): {e}")
        traceback.print_exc()
    except Exception as e:
        print(f"❌ Fernet initialization failed (Unexpected): {e}")
        traceback.print_exc()
else:
    if not CRYPTO_READY:
        print(f"⚠️  Fernet NOT initialized - CRYPTO_READY is False")
        print(f"   Reason: {IMPORT_ERROR_MESSAGE}")
    else:
        print(f"⚠️  Fernet NOT initialized - Fernet class not available")


def generate_and_encrypt_cardano_wallet() -> Tuple[str, str]:
    """
    Generates a new Cardano key pair, derives a Preprod Testnet address, 
    and encrypts the payment signing key (private key).
    
    Returns:
        Tuple[str, str]: (address, encrypted_skey_hex) or ("", "") if failed
    """
    print("\n" + "=" * 80)
    print("🔑 ATTEMPTING CARDANO WALLET GENERATION")
    print("=" * 80)
    
    if not CRYPTO_READY:
        print(f"❌ BLOCKED: PyCardano not available")
        print(f"   Reason: {IMPORT_ERROR_MESSAGE}")
        print("=" * 80 + "\n")
        return "", ""
    
    if not fernet:
        print(f"❌ BLOCKED: Encryption not initialized")
        print(f"   CRYPTO_READY: {CRYPTO_READY}")
        print(f"   Fernet object: {fernet}")
        print("=" * 80 + "\n")
        return "", ""

    try:
        print("Step 1: Generating payment signing key...")
        payment_signing_key = PaymentSigningKey.generate()
        print("✅ Signing key generated")
        
        print("Step 2: Deriving verification key...")
        payment_verification_key = PaymentVerificationKey.from_signing_key(payment_signing_key)
        print("✅ Verification key derived")

        print("Step 3: Creating testnet address...")
        address = Address(
            payment_part=payment_verification_key.hash(), 
            network=Network.TESTNET_PREPROD 
        )
        print(f"✅ Address created: {str(address)[:30]}...")

        print("Step 4: Encrypting signing key...")
        skey_bytes = payment_signing_key.to_bytes()
        encrypted_skey_bytes = fernet.encrypt(skey_bytes)
        encrypted_hex = encrypted_skey_bytes.hex()
        print(f"✅ Signing key encrypted ({len(encrypted_hex)} chars)")
        
        print("\n✅ WALLET GENERATION SUCCESSFUL")
        print("=" * 80 + "\n")
        
        return str(address), encrypted_hex

    except Exception as e:
        print("\n" + "=" * 80)
        print("❌ WALLET GENERATION FAILED")
        print("=" * 80)
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {e}")
        print("\nFull traceback:")
        traceback.print_exc()
        print("=" * 80 + "\n")
        return "", ""


def decrypt_skey(encrypted_skey_hex: str) -> Optional[Any]:
    """
    Decrypts the stored signing key hex string back into a PyCardano object.
    
    Args:
        encrypted_skey_hex: Hex-encoded encrypted signing key
        
    Returns:
        PaymentSigningKey object or None if decryption fails
    """
    if not fernet:
        raise Exception("Encryption utility not initialized")
    
    if not CRYPTO_READY:
        raise Exception("Cannot create PaymentSigningKey: PyCardano not available")

    try:
        encrypted_skey_bytes = bytes.fromhex(encrypted_skey_hex)
        skey_bytes = fernet.decrypt(encrypted_skey_bytes)
        return PaymentSigningKey.from_bytes(skey_bytes)
    except Exception as e:
        print(f"❌ Failed to decrypt signing key: {e}")
        traceback.print_exc()
        return None