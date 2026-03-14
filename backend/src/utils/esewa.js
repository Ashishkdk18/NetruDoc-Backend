import crypto from 'crypto';

export const generateEsewaSignature = (totalAmount, transactionUuid, productCode, secretKey) => {
  const data = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(data);
  return hmac.digest('base64');
};

export const verifyEsewaSignature = (encodedData, secretKey) => {
  try {
    const decodedData = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf-8'));
    const { total_amount, transaction_uuid, product_code, signature } = decodedData;

    if (!signature || !transaction_uuid || !product_code) return false;

    // eSewa may return total_amount as number or string (e.g. "1,000.0"); format consistently for signature
    const totalAmountStr = total_amount != null
      ? (typeof total_amount === 'string' ? total_amount : Number(total_amount).toFixed(1))
      : '';
    const message = `total_amount=${totalAmountStr},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(message);
    const expectedSignature = hmac.digest('base64');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying eSewa signature:', error);
    return false;
  }
};
