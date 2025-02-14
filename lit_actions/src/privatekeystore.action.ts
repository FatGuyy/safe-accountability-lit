/**
 * NAME: privatekeystore
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
