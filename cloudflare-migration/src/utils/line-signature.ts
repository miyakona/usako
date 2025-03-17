export async function verifyLineSignature(
  rawBody: string, 
  signature: string, 
  channelSecret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(channelSecret);
    const bodyData = encoder.encode(rawBody);

    const cryptoKey = await crypto.subtle.importKey(
      'raw', 
      secretKey, 
      { name: 'HMAC', hash: 'SHA-256' }, 
      false, 
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      { name: 'HMAC', hash: 'SHA-256' }, 
      cryptoKey, 
      bodyData
    );

    const computedSignature = btoa(
      String.fromCharCode.apply(
        null, 
        Array.from(new Uint8Array(signatureBuffer))
      )
    );

    return computedSignature === signature;
  } catch (error) {
    console.error('署名検証エラー:', error);
    return false;
  }
} 