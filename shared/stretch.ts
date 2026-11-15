// The password never leaves the device as typed: it is stretched here (PBKDF2-SHA256, 150,000 rounds, salted
// with the username) and only the result is sent. The server stores a salted hash of that.
export async function stretch(username: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const salt = enc.encode(`ohel:${username.normalize("NFC").trim().toLowerCase()}`);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 150_000 }, key, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
