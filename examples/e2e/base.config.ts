import { devices, type Project } from "@playwright/test";

export const baseProjects: Project[] = [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
    { name: "mobile-safari-landscape", use: { ...devices["iPhone 13 landscape"] } },
    { name: "tablet-ipad", use: { ...devices["iPad Pro 11"] } },
    { name: "tablet-ipad-landscape", use: { ...devices["iPad Pro 11 landscape"] } },
    { name: "tablet-galaxy", use: { ...devices["Galaxy Tab S4"] } },
    { name: "tablet-galaxy-landscape", use: { ...devices["Galaxy Tab S4 landscape"] } },
]