// ============================================================
// Hermes Chat — SSH Tunnel Service
// Manages an SSH connection to a remote host for secure data
// transmission. Uses the ssh2 library and supports both private
// key and password authentication.
// ============================================================

import { Client, type ClientChannel } from 'ssh2';
import { readFileSync } from 'node:fs';
import type { SSHConfig } from '../types/index.js';

// -----------------------------------------------------------
// Constants
// -----------------------------------------------------------

/** SSH connection timeout in milliseconds. */
const CONNECT_TIMEOUT = 10_000;

// -----------------------------------------------------------
// SshTunnel
// -----------------------------------------------------------

export class SshTunnel {
  private client: Client | null = null;
  private channel: ClientChannel | null = null;
  private connected = false;

  // -----------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------

  /**
   * Establish an SSH connection to the configured remote host.
   *
   * Supports both private key (preferred) and password
   * authentication. The connection will time out after
   * {@link CONNECT_TIMEOUT} ms.
   *
   * @param config - SSH connection parameters.
   * @returns       Resolves when the connection is ready.
   * @throws        If authentication fails or the connection times out.
   */
  async establish(config: SSHConfig): Promise<void> {
    // Tear down any existing connection first
    this.close();

    this.client = new Client();

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.client?.end();
        reject(new Error('SSH connection timed out after 10 seconds.'));
      }, CONNECT_TIMEOUT);

      this.client!.on('ready', () => {
        clearTimeout(timer);
        this.connected = true;
        console.log(
          `[SshTunnel] SSH connection established to ${config.host}:${config.port}`,
        );
        resolve();
      });

      this.client!.on('error', (err: Error) => {
        clearTimeout(timer);
        this.connected = false;
        console.error(`[SshTunnel] SSH error: ${err.message}`);
        reject(err);
      });

      this.client!.on('close', () => {
        this.connected = false;
        console.log('[SshTunnel] SSH connection closed.');
      });

      const connectParams: Record<string, unknown> = {
        host: config.host,
        port: config.port,
        username: config.username,
        readyTimeout: CONNECT_TIMEOUT,
      };

      // Private key auth (preferred) — read synchronously before connection
      if (config.privateKeyPath) {
        try {
          connectParams.privateKey = readFileSync(config.privateKeyPath, 'utf8');
        } catch {
          // Key file not found — fall through to password auth
          console.warn(
            `[SshTunnel] Private key not found at ${config.privateKeyPath}, falling back to password.`,
          );
        }
      }

      // Password auth (fallback)
      if (config.password && !connectParams.privateKey) {
        connectParams.password = config.password;
      }

      // Require at least one auth method
      if (!connectParams.privateKey && !connectParams.password) {
        clearTimeout(timer);
        reject(
          new Error('SSH authentication requires either a private key or password.'),
        );
        return;
      }

      this.client!.connect(connectParams);
    });
  }

  // -----------------------------------------------------------
  // Data Transfer
  // -----------------------------------------------------------

  /**
   * Send data securely through the SSH tunnel.
   *
   * The data is serialized to JSON and written to a shell channel.
   * This method requires an active connection — if the tunnel is
   * not established it will throw an error.
   *
   * @param data - Arbitrary data to transmit (will be JSON-stringified).
   * @throws      If the tunnel is not connected.
   */
  async sendSecureData(data: unknown): Promise<void> {
    if (!this.isActive() || !this.client) {
      throw new Error('[SshTunnel] Cannot send data — tunnel is not connected.');
    }

    return new Promise<void>((resolve, reject) => {
      this.client!.exec(
        JSON.stringify(data),
        (err: Error | undefined, stream: ClientChannel) => {
          if (err) {
            reject(err);
            return;
          }

          let output = '';
          stream
            .on('data', (chunk: Buffer) => {
              output += chunk.toString();
            })
            .on('close', (code: number | null) => {
              if (code !== 0) {
                console.warn(
                  `[SshTunnel] Remote command exited with code ${code}: ${output}`,
                );
              }
              resolve();
            })
            .stderr.on('data', (chunk: Buffer) => {
              console.error(`[SshTunnel] stderr: ${chunk.toString()}`);
            });
        },
      );
    });
  }

  // -----------------------------------------------------------
  // Status
  // -----------------------------------------------------------

  /**
   * Check whether the SSH tunnel is currently active.
   *
   * @returns true if the client exists and the connection is established.
   */
  isActive(): boolean {
    return this.connected && this.client !== null;
  }

  // -----------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------

  /**
   * Close the SSH connection and release all resources.
   *
   * Safe to call even when not connected — will be a no-op.
   */
  close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.client) {
      this.client.end();
      this.client = null;
    }
    this.connected = false;
  }
}
