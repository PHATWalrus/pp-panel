import { NextResponse } from "next/server";
import { isbot } from "isbot";

const SCRAPER_BOT_PATTERNS = [
    /bot/i,
    /crawl/i,
    /spider/i,
    /slurp/i,
    /scraper/i,
    /harvest/i,
    /gather/i,
    /fetch/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /python-urllib/i,
    /scrapy/i,
    /mechanize/i,
    /phantomjs/i,
    /headless/i,
    /selenium/i,
    /puppeteer/i,
    /playwright/i,
    /bingbot/i,
    /googlebot/i,
    /yandexbot/i,
    /duckduckbot/i,
    /baiduspider/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /whatsapp/i,
    /telegrambot/i,
    /slackbot/i,
    /discordbot/i,
    /ahrefsbot/i,
    /semrushbot/i,
    /moz\.com/i,
    /mj12bot/i,
    /dotbot/i,
    /screaming frog/i,
    /bytespider/i,
    /petalbot/i,
    /dataforseo/i,
    /serpstatbot/i,
    /rogerbot/i,
];

function isKnownScraper(userAgent) {
    if (!userAgent || typeof userAgent !== "string") return false;
    const ua = userAgent.toLowerCase();
    return isbot(userAgent) || SCRAPER_BOT_PATTERNS.some((p) => p.test(ua));
}

export default async function middleware(request) {
    const ua = request.headers.get("user-agent") || "";
    if (isKnownScraper(ua)) {
        return new Response(null, {
            status: 503,
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Retry-After": "86400",
                "Cache-Control": "no-store, no-cache, max-age=0",
            },
        });
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};