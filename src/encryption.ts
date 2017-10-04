import crypto = require('crypto');

const algorithm = 'aes-256-ctr';

export function encrypt(key: string, text: string ): string {
    var cipher = crypto.createCipher(algorithm, key);
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

export function decrypt(key: string, text: string): string {
    var decipher = crypto.createDecipher(algorithm, key);
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
    return dec;
}