import axios from "axios";
import { getRuntimeConfig } from "@/lib/config/runtimeConfig";

const { apiBase } = getRuntimeConfig();

export const http = axios.create({
  baseURL: apiBase,
  timeout: 15000,
});
