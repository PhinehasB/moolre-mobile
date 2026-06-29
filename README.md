# Klare — Personal (Mobile)

**Your money, already sorted.**

Klare is an automated salary-management and bill-settlement platform built on the
[Moolre](https://moolre.com) payment ecosystem for the Ghanaian market. This repository is
**`klare-mobile`** — the **Klare Personal** app that employees and individuals use to receive their
salary into a Klare wallet, let Klare set bills aside automatically, send money, top up, and track
everything in real time.

It talks to the **`klare-server`** backend (Spring Boot). The two apps in the wider project:

| App | Who it's for | Stack |
|-----|--------------|-------|
| **Klare Business** (`klare-server` + web) | Employers — fund a wallet, manage a team, run payroll | Spring Boot, PostgreSQL |
| **Klare Personal** (`klare-mobile`) — *this repo* | Employees & individuals | Expo / React Native |

---

## Tech stack

| Area | Choice |
|------|--------|
| Runtime | Expo SDK 54, React Native 0.81, React 19 |
| Language | TypeScript |
| Navigation | `expo-router` (file-based routing, typed routes) |
| Auth storage | `expo-secure-store` (tokens kept in the device keychain) |
| Notifications | `expo-notifications` + `expo-device` (EAS push) |
| Fonts | Inter + Space Grotesk (`@expo-google-fonts`) |
| Lint | `eslint-config-expo` |

## How it works

Two kinds of account share one app, distinguished by the backend:

- **Employee** — credentials are issued by their employer in Klare Business and sent by email/SMS.
  First sign-in **forces a password change** (activation), then they're in. Their salary lands in
  their Klare wallet automatically on payday.
- **Individual** — anyone whose employer isn't on Klare can **sign up** directly and fund the wallet
  themselves.

Money is held in Klare's master Moolre account and tracked per user as a wallet with two parts:
**free spendable cash** and a **locked safe wallet** reserved for bills. On payday Klare splits the
salary, locks the bill portion, and offers to pay each bill for real via Moolre.

## Features

- **Auth** — login (employer-issued or self-signup), forced first-login activation, "remember me",
  automatic redirect to login on token expiry, sign-out from the profile screen.
- **Home** — free vs. locked wallet split, next-salary countdown, this month's bills, quick actions.
- **Salary received** — an interactive modal on payday: **toggle a bill off, edit an amount, or let
  Klare pay them all** from the safe wallet (real Moolre disbursement).
- **Bills** — add / **tap-to-edit** (name, amount, category, network, recipient) / pause / delete,
  plus a **Pay bills now** button.
- **Send money** — real Moolre transfer to any Ghana mobile-money number.
- **Add money** — real Moolre collection (MoMo debit with OTP / phone approval, then polled to
  completion) that credits the wallet.
- **Activity** — grouped history of salary, sweeps, transfers, bill payments and top-ups.
- **Notifications** — push + email + SMS when salary is paid.

## Prerequisites

- Node 18+ and npm
- The [Expo Go](https://expo.dev/go) app on your phone, or an Android/iOS simulator
- A running **`klare-server`** instance reachable from your phone

## Setup

```bash
npm install
```

Create a `.env` in the project root pointing at your backend:

```bash
# Your machine's LAN IP so a physical phone can reach the server (not localhost)
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8080
```

> The phone and the computer running `klare-server` must be on the **same Wi-Fi**, and the URL must
> use the machine's LAN IP — `localhost` resolves to the phone itself. `EXPO_PUBLIC_*` values are
> inlined at bundle time, so **restart with cache cleared** (`npx expo start -c`) after changing them.

## Run

```bash
npm start            # Expo dev server (press i / a, or scan the QR in Expo Go)
npm run ios          # open in the iOS simulator
npm run android      # open in the Android emulator
npm run lint         # eslint
npx tsc --noEmit     # type-check
```

## Project structure

```
app/                       file-based routes (expo-router)
  index.tsx                splash / entry
  login.tsx  signup.tsx  activate.tsx
  (tabs)/                  signed-in tab bar
    home.tsx  bills.tsx  send.tsx  activity.tsx
  add-expense.tsx          add / edit a bill
  add-money.tsx            top up the wallet
  profile.tsx  sent-success.tsx
components/                shared UI (TextField, SelectField, SalaryReceivedModal, …)
lib/
  api.ts                   typed client for klare-server (all endpoints + types)
  auth.tsx                 session context, secure-store persistence, 401 handling
  push.ts                  EAS push-token registration
  format.ts  categories.ts  networks.tsx  storage.ts
constants/                 theme (colors, fonts)
```

## Notes

- **Real money:** Send and Add-money hit live Moolre — they move actual funds.
- **No code comments:** this codebase is intentionally comment-free; keep contributions the same.
- **Secrets** live in `.env` (git-ignored); never commit API URLs or keys.
