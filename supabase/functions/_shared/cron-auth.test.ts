import { assertEquals } from "jsr:@std/assert@1"
import { cronAutorizado, mesmoSegredo } from "./cron-auth.ts"

const req = (h: Record<string, string> = {}) => new Request("http://x", { method: "POST", headers: h })
const segredo = () => Promise.resolve("s3gr3do")

Deno.test("cron:true sem segredo NÃO autoriza", async () => {
  assertEquals(await cronAutorizado(req(), { cron: true }, segredo), false)
})
Deno.test("segredo errado NÃO autoriza", async () => {
  assertEquals(await cronAutorizado(req({ "x-cron-secret": "outro" }), { cron: true }, segredo), false)
})
Deno.test("segredo certo sem cron:true NÃO vira cron", async () => {
  assertEquals(await cronAutorizado(req({ "x-cron-secret": "s3gr3do" }), {}, segredo), false)
})
Deno.test("cron:true + segredo certo autoriza", async () => {
  assertEquals(await cronAutorizado(req({ "x-cron-secret": "s3gr3do" }), { cron: true }, segredo), true)
})
Deno.test("sem segredo configurado, ninguém passa (nem com header vazio)", async () => {
  assertEquals(await cronAutorizado(req({ "x-cron-secret": "" }), { cron: true }, () => Promise.resolve("")), false)
  assertEquals(await mesmoSegredo("", ""), false)
})

import { cronOuUsuario } from "./cron-auth.ts"
const semUsuario = () => Promise.resolve(false)
const comUsuario = () => Promise.resolve(true)

Deno.test("cronOuUsuario: sem segredo e sem sessão → null (401 antes de ler)", async () => {
  assertEquals(await cronOuUsuario(req(), { cron: true, test: true }, { lerSegredo: segredo, usuario: semUsuario }), null)
})
Deno.test("cronOuUsuario: segredo errado e sem sessão → null", async () => {
  assertEquals(await cronOuUsuario(req({ "x-cron-secret": "x" }), { cron: true }, { lerSegredo: segredo, usuario: semUsuario }), null)
})
Deno.test("cronOuUsuario: segredo certo → cron", async () => {
  assertEquals(await cronOuUsuario(req({ "x-cron-secret": "s3gr3do" }), { cron: true }, { lerSegredo: segredo, usuario: semUsuario }), "cron")
})
Deno.test("cronOuUsuario: sessão autorizada → usuario", async () => {
  assertEquals(await cronOuUsuario(req(), { test: true }, { lerSegredo: segredo, usuario: comUsuario }), "usuario")
})
