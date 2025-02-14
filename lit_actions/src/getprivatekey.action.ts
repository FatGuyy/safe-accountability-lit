/**
 * NAME: getprivatekey
 */

(async () => {
  const sigShare = await LitActions.signEcdsa({
    toSign: new Uint8Array([1, 2, 3, 4, 5]),
    publicKey, // <-- You should pass this in jsParam
    sigName,
  });

  LitActions.setResponse({
    response: JSON.stringify({
      foo: 'bar',
    }),
  });
})();
(async () => {
  const encryptedKey = "STORED_ENCRYPTED_KEY"; // Fetch this from storage
  
  const decryptedKey = await LitActions.decrypt({
    encryptedData: encryptedKey,
    publicKey,  // Pass in jsParam
  });

  LitActions.setResponse({
    response: JSON.stringify({
      privateKey: decryptedKey,
    }),
  });
})();