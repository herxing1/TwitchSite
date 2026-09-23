"use strict";
var SalonData = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // outputs/twitch-site/src/lib/content.ts
  var content_exports = {};
  __export(content_exports, {
    safeUrl: () => safeUrl,
    validDate: () => validDate,
    validateContent: () => validateContent,
    validateLibraries: () => validateLibraries
  });
  function safeUrl(value) {
    if (typeof value !== "string") return false;
    try {
      const u = new URL(value);
      return u.protocol === "https:" && !u.username && !u.password;
    } catch {
      return false;
    }
  }
  var isObject = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  function validDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) return false;
    const [year, month, day] = value.slice(0, 10).split("-").map(Number);
    return month >= 1 && month <= 12 && day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate() && Number(value.slice(11, 13)) < 24;
  }
  function validateContent(input) {
    if (!isObject(input) || input.version !== 1 || !isObject(input.site)) throw new Error("Ce fichier doit \xEAtre un contenu.json de version 1.");
    const s = input.site;
    for (const [key, max] of Object.entries({ name: 60, tagline: 120, description: 500, about: 6e3, twitch: 100, timezone: 80 })) {
      if (typeof s[key] !== "string" || s[key].length > max) throw new Error(`Champ \xAB ${key} \xBB manquant ou trop long (maximum ${max}).`);
    }
    if (!s.name.trim() || !s.tagline.trim()) throw new Error("Le nom et le titre d\u2019accueil sont obligatoires.");
    if (s.twitch && !/^[a-zA-Z0-9_]{3,25}$/.test(s.twitch)) throw new Error("Entre le pseudo Twitch uniquement, sans adresse ni @.");
    try {
      new Intl.DateTimeFormat("fr", { timeZone: s.timezone });
    } catch {
      throw new Error("Fuseau horaire inconnu.");
    }
    if (!Array.isArray(s.links) || s.links.length > 20) throw new Error("Liste de liens invalide (20 maximum).");
    for (const link of s.links) if (!isObject(link) || typeof link.label !== "string" || !link.label.trim() || link.label.length > 60 || !safeUrl(link.url)) throw new Error("Chaque lien doit avoir un nom et une adresse HTTPS valide.");
    const ids = /* @__PURE__ */ new Set();
    for (const key of ["streams", "events"]) {
      const rows = input[key];
      if (!Array.isArray(rows) || rows.length > 1e3) throw new Error(`Liste ${key} invalide (1 000 maximum).`);
      for (const row of rows) {
        if (!isObject(row)) throw new Error("Rendez-vous invalide.");
        if (typeof row.id !== "string" || !/^[\w-]{1,80}$/.test(row.id) || ids.has(row.id)) throw new Error("Identifiant de rendez-vous manquant ou dupliqu\xE9.");
        ids.add(row.id);
        if (typeof row.title !== "string" || !row.title.trim() || row.title.length > 120) throw new Error("Chaque rendez-vous doit avoir un titre (120 caract\xE8res maximum).");
        if (!validDate(row.start) || !validDate(row.end) || Date.parse(row.end) <= Date.parse(row.start)) throw new Error(`Dates invalides pour \xAB ${row.title} \xBB : la fin doit suivre le d\xE9but.`);
        if (typeof row.game !== "string" || row.game.length > 100 || typeof row.description !== "string" || row.description.length > 3e3) throw new Error("Jeu ou description manquant ou trop long.");
      }
    }
  }
  function validateLibraries(value) {
    if (!isObject(value) || value.version !== 1) throw new Error("Biblioth\xE8que invalide.");
    for (const platform of ["steam", "epic"]) {
      const l = value[platform];
      if (!isObject(l) || !(l.updatedAt === null || validDate(l.updatedAt)) || !Array.isArray(l.games)) throw new Error("Biblioth\xE8que invalide.");
      const ids = /* @__PURE__ */ new Set();
      for (const g of l.games) {
        if (!isObject(g) || typeof g.id !== "string" || typeof g.title !== "string" || !g.id || !g.title.trim() || ids.has(g.id)) throw new Error("Jeu invalide ou dupliqu\xE9.");
        ids.add(g.id);
      }
    }
  }
  return __toCommonJS(content_exports);
})();
