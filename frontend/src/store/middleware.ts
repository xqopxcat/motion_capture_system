import type { Middleware } from "@reduxjs/toolkit";
import { baseApi } from "../services/baseApi";

export const middleware: Middleware[] = [baseApi.middleware];
