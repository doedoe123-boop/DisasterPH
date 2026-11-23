import https from "node:https";
import tls from "node:tls";
import zlib from "node:zlib";

/**
 * PHIVOLCS's servers send only their own certificate and leave out the
 * issuing intermediate (checked 2026-11-23, after the *.phivolcs.dost.gov.ph
 * certificate was renewed on 2026-11-19). Browsers fetch the missing
 * intermediate themselves; Node does not, so `fetch` fails with
 * UNABLE_TO_VERIFY_LEAF_SIGNATURE.
 *
 * Certificate checking stays fully on. We only add the public intermediate
 * that PHIVOLCS should be sending. It is signed by "GlobalSign Root R46",
 * which is already in Node's trusted roots, and is pinned here by SHA-256:
 *
 *   CN=GlobalSign GCC R46 OV TLS CA 2025, O=GlobalSign nv-sa, C=BE
 *   SHA-256 D1:60:E2:DE:4E:56:CB:10:B6:6C:1C:B0:AD:CB:79:CF:
 *           93:C7:8D:CD:9D:B3:0C:20:18:22:02:62:C0:40:63:F9
 *   valid 2025-09-17 .. 2029-06-23
 *   from http://secure.globalsign.com/cacert/gsgccr46ovtlsca2025.crt
 *        (the CA Issuers URL in the PHIVOLCS certificate)
 *
 * If PHIVOLCS fixes its server or changes CA, normal roots still apply; this
 * only adds an option. When it expires or stops matching, the PHIVOLCS source
 * fails visibly and the labelled USGS fallback takes over.
 */
export const GLOBALSIGN_GCC_R46_OV_TLS_CA_2025 = `-----BEGIN CERTIFICATE-----
MIIFfDCCA2SgAwIBAgIRAIRDWJCDb2c5QYLLnJpdyZ8wDQYJKoZIhvcNAQELBQAw
RjELMAkGA1UEBhMCQkUxGTAXBgNVBAoTEEdsb2JhbFNpZ24gbnYtc2ExHDAaBgNV
BAMTE0dsb2JhbFNpZ24gUm9vdCBSNDYwHhcNMjUwOTE3MDI1NTU2WhcNMjkwNjIz
MDAwMDAwWjBUMQswCQYDVQQGEwJCRTEZMBcGA1UEChMQR2xvYmFsU2lnbiBudi1z
YTEqMCgGA1UEAxMhR2xvYmFsU2lnbiBHQ0MgUjQ2IE9WIFRMUyBDQSAyMDI1MIIB
IjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1JyrGiv+210Lw4LTp9qxx9WC
o6w8HnxcTKr5XwR6WwtKidGXriLqGXtBINGTi4HUZ1Vl3FUIvscLwNcq2DRLwjWs
cYFNClVnuSw4CtwAcfa7Iltz+0FmFeh/KOWv5BfgCxAo9FaeXRG725b2eedo/7fb
0zBc6M/XcfQREVteZ6GovnLE96+T8RzRImvX38Y8vZoulp/XWv3p09C1pgp/53+1
itDl7xbrM4sglGNkeJ5LBN2dOR1sqWCMZ/V4a4cPQwopBtZis1vVh7/k4S6Ysgk0
CTi5vei0RSEIhxoFk48BHSXzTA4FJxqjfauYCZ4M5tmZ/R5VgXOZ4Ck/PifnXQID
AQABo4IBVTCCAVEwDgYDVR0PAQH/BAQDAgGGMBMGA1UdJQQMMAoGCCsGAQUFBwMB
MBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFGl0Pq/DWwGVSe4UQVqT+rEw
mNqiMB8GA1UdIwQYMBaAFANcq3OBh6jMsKbVlOI2lkn/BZksMHsGCCsGAQUFBwEB
BG8wbTAuBggrBgEFBQcwAYYiaHR0cDovL29jc3AuZ2xvYmFsc2lnbi5jb20vcm9v
dHI0NjA7BggrBgEFBQcwAoYvaHR0cDovL3NlY3VyZS5nbG9iYWxzaWduLmNvbS9j
YWNlcnQvcm9vdHI0Ni5jcnQwNgYDVR0fBC8wLTAroCmgJ4YlaHR0cDovL2NybC5n
bG9iYWxzaWduLmNvbS9yb290cjQ2LmNybDAhBgNVHSAEGjAYMAgGBmeBDAECAjAM
BgorBgEEAaAyCgECMA0GCSqGSIb3DQEBCwUAA4ICAQBEUTiKxe5jEintARUvLBm9
qWZtGiOSV9E+3bntbFFBDBAroqwB6Cj53Zp/W08HwgxaPXdkVaRNYHB/eAatEtSm
1ldtoorfPc+mVlzbwCwfbpIs2uqW5rF78ne37qy2o+iVnJptq9AzPnlC03+zhhB9
JwmjUXVtPuqQZ96tFl0fAT77xGSLzCO8yfEDrxCqdWz2wneShSbCCsC15JB07OgO
StE+MsVBkwe5+PNzAlAr8NZ6f8mzeY/FzaBzlhYw5+c1yyzXJqp+gjRXWrLpD3Ho
hGOvIXIvCBnyVrYI/HPe6DR5w7oteui9Rt0xfUUudaTkt0iz7fc23eGboZ+bpvgT
gbd/kYK6JOrxawMyfBYxrR5zDHIJX0Mws99DNgACKBUfFadKAfwFw0+0airY5WAI
Xs8yhCb5XGwyzVpcB30BrQbWtqdI0PoE9usNvNbH3YFGfuS8oRmAJEgUUQnwOoGK
jMWtHacw0n8QESdRM274LJvLd9nwawYU4svJpf06FtKPqGH3nXefL741NO9KzDAG
PM11YScyJVfYdBDXFM86HU1fBGTKlkLcG/qMJxOqppY4wydRI3koSH6A78nO2QaJ
yqjTOQyCNHaSlmGjdiOvhJ8y1PiazHnuvWBx6z+7JJF2ukqqfjlSARwyfkfnRUIY
la7ZYEqcc56eoPAiElhvrg==
-----END CERTIFICATE-----
`;

const PHIVOLCS_CA = [...tls.rootCertificates, GLOBALSIGN_GCC_R46_OV_TLS_CA_2025];

/** Hosts this helper may be used for. */
const ALLOWED_HOSTS = /(^|\.)phivolcs\.dost\.gov\.ph$/;

/** Decompress per Content-Encoding, capping the decompressed size. */
export function decodeBody(body: Buffer, encoding: string | undefined, maxBytes: number): string {
  const opts = { maxOutputLength: maxBytes };
  switch ((encoding ?? "identity").trim().toLowerCase()) {
    case "gzip":
    case "x-gzip":
      return zlib.gunzipSync(body, opts).toString("utf8");
    case "deflate":
      return zlib.inflateSync(body, opts).toString("utf8");
    case "br":
      return zlib.brotliDecompressSync(body, opts).toString("utf8");
    case "identity":
    case "":
      return body.toString("utf8");
    default:
      throw new Error(`Unsupported content encoding: ${encoding}`);
  }
}

/**
 * GET a PHIVOLCS page as text over verified HTTPS. No redirects are
 * followed. The server compresses even when not asked (gzip, ~74 KB for the
 * 2.6 MB earthquake page), so responses are decompressed; both the
 * compressed and decompressed sizes are capped at `maxBytes`.
 */
export function fetchPhivolcsText(
  url: string,
  { timeoutMs = 20_000, maxBytes = 12 * 1024 * 1024 } = {},
): Promise<{ status: number; text: string }> {
  const target = new URL(url);
  if (target.protocol !== "https:" || !ALLOWED_HOSTS.test(target.hostname)) {
    return Promise.reject(new Error(`Not a PHIVOLCS https URL: ${target.origin}`));
  }
  return new Promise((resolve, reject) => {
    const req = https.get(
      target,
      {
        ca: PHIVOLCS_CA,
        timeout: timeoutMs,
        headers: {
          Accept: "text/html",
          "Accept-Encoding": "gzip, deflate",
          "User-Agent": "DisasterPH (public disaster information site)",
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) {
            req.destroy(new Error(`PHIVOLCS response larger than ${maxBytes} bytes`));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          try {
            const text = decodeBody(Buffer.concat(chunks), res.headers["content-encoding"], maxBytes);
            resolve({ status: res.statusCode ?? 0, text });
          } catch (error) {
            reject(error);
          }
        });
        res.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new Error(`PHIVOLCS request timed out after ${timeoutMs} ms`)));
    req.on("error", reject);
  });
}
