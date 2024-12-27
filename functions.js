import got from "got";
import { toBuffer } from "@whiskeysockets/baileys";
import { fileTypeFromBuffer } from "file-type";

export default {
    bestQuality(video) {
        const pixel = ["1080p", "720p", "480p", "360p", "240p", "144p"];
        for (let quality of pixel) {
            if (video[quality]) {
                return video[quality];
            }
        }
        return null;
    },
    delay(time) {
        return new Promise(res => setTimeout(res, time));
    },
    async fetchBuffer(url, options = {}, responseType = 'buffer') {
        try {
            const headers = {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "Upgrade-Insecure-Requests": "1",
                "User-Agent": this.randomUA(),
                ...options.headers,
            };

            const response = await got(url, {
                headers,
                responseType,
                ...options,
            });

            let buffer;
            if (responseType === 'stream') {
                buffer = await toBuffer(response.rawBody);
            } else {
                buffer = response.rawBody;
            }

            const contentDisposition = response.headers['content-disposition'];
            const filenameMatch = contentDisposition?.match(/filename=(?:(?:"|')(.*?)(?:"|')|([^""\s]+))/);
            const filename = filenameMatch ? decodeURIComponent(filenameMatch[1] || filenameMatch[2]) : null;

            const fileType = await fileTypeFromBuffer(buffer);
            const mimetype = fileType?.mime || 'application/octet-stream';
            const ext = fileType?.ext || 'bin';

            return { data: buffer, filename, mimetype, ext };
        } catch (error) {
            throw new Error(`Failed to fetch buffer: ${error.message}`);
        }
    },
    async fetchJson(url, options = {}) {
        try {
            const response = await got(url, {
                headers: {
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                    "User-Agent": this.randomUA(),
                    ...(options.headers || {}),
                },
                responseType: "json",
                ...options,
            });
            return response.body;
        } catch (error) {
            throw new Error(`Failed to fetch JSON: ${error.message}`);
        }
    },
    randomUA() {
        const UAs = [
            "Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            "Mozilla/5.0 (Windows NT 6.1 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            "Mozilla/5.0 (Windows NT 6.3 WOW64 rv:53.0) Gecko/20100101 Firefox/53.0",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10_12_5) AppleWebKit/603.2.4 (KHTML, like Gecko) Version/10.1.1 Safari/603.2.4",
            "Mozilla/5.0 (Windows NT 10.0 WOW64 rv:53.0) Gecko/20100101 Firefox/53.0",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            "Mozilla/5.0 (Windows NT 6.1 WOW64 rv:53.0) Gecko/20100101 Firefox/53.0",
            "Mozilla/5.0 (Windows NT 6.3 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            "Mozilla/5.0 (X11 Ubuntu Linux x86_64 rv:53.0) Gecko/20100101 Firefox/53.0",
            "Mozilla/5.0 (X11 Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            "Mozilla/5.0 (Windows NT 6.1 WOW64 Trident/7.0 rv:11.0) like Gecko",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10.12 rv:53.0) Gecko/20100101 Firefox/53.0",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10_12_4) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.1 Safari/603.1.30",
            "Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.86 Safari/537.36",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0 WOW64 Trident/7.0 rv:11.0) like Gecko",
            "Mozilla/5.0 (Windows NT 10.0 Win64 x64 rv:53.0) Gecko/20100101 Firefox/53.0",
            "Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393",
            "Mozilla/5.0 (X11 Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.86 Safari/537.36",
            "Mozilla/5.0 (Windows NT 6.1 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.86 Safari/537.36",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.86 Safari/537.36",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10.11 rv:53.0) Gecko/20100101 Firefox/53.0",
            "Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36",
            "Mozilla/5.0 (Windows NT 6.1 rv:53.0) Gecko/20100101 Firefox/53.0",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10_11_6) AppleWebKit/603.2.5 (KHTML, like Gecko) Version/10.1.1 Safari/603.2.5",
            "Mozilla/5.0 (X11 Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/58.0.3029.110 Chrome/58.0.3029.110 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0 WOW64 rv:54.0) Gecko/20100101 Firefox/54.0",
            "Mozilla/5.0 (Windows NT 6.1 Trident/7.0 rv:11.0) like Gecko",
            "Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36 Edge/15.15063",
            "Mozilla/5.0 (Windows NT 6.1 WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            "Mozilla/5.0 (X11 Linux x86_64 rv:53.0) Gecko/20100101 Firefox/53.0",
            "Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 OPR/45.0.2552.888",
            "Mozilla/5.0 (Windows NT 6.1 Win64 x64 rv:53.0) Gecko/20100101 Firefox/53.0",
            "Mozilla/5.0 (X11 Linux x86_64 rv:45.0) Gecko/20100101 Firefox/45.0",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10_10_5) AppleWebKit/603.2.5 (KHTML, like Gecko) Version/10.1.1 Safari/603.2.5",
            "Mozilla/5.0 (Windows NT 10.0 WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            "Mozilla/5.0 (Windows NT 6.3 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36",
            "Mozilla/5.0 (iPad CPU OS 10_3_2 like Mac OS X) AppleWebKit/603.2.4 (KHTML, like Gecko) Version/10.0 Mobile/14F89 Safari/602.1",
            "Mozilla/5.0 (Windows NT 6.1 WOW64 rv:52.0) Gecko/20100101 Firefox/52.0",
            "Mozilla/5.0 (Windows NT 6.1 WOW64 rv:54.0) Gecko/20100101 Firefox/54.0",
            "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36",
            "Mozilla/5.0 (X11 Ubuntu Linux x86_64 rv:54.0) Gecko/20100101 Firefox/54.0",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10_12_3) AppleWebKit/602.4.8 (KHTML, like Gecko) Version/10.0.3 Safari/602.4.8",
            "Mozilla/5.0 (X11 Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.81 Safari/537.36 OPR/45.0.2552.812",
            "Mozilla/5.0 (X11 Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.81 Safari/537.36",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            "Mozilla/5.0 (Windows NT 5.1 rv:52.0) Gecko/20100101 Firefox/52.0",
            "Mozilla/5.0 (X11 Linux x86_64 rv:52.0) Gecko/20100101 Firefox/52.0",
            "Mozilla/5.0 (Windows NT 6.1 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.96 Safari/537.36",
            "Mozilla/5.0 (X11 Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10.12 rv:54.0) Gecko/20100101 Firefox/54.0",
            "Mozilla/5.0 (Windows NT 6.1 WOW64 rv:40.0) Gecko/20100101 Firefox/40.1",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10.10 rv:53.0) Gecko/20100101 Firefox/53.0",
            "Mozilla/5.0 (X11 Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36",
            "Mozilla/5.0 (compatible MSIE 9.0 Windows NT 6.0 Trident/5.0 Trident/5.0)",
            "Mozilla/5.0 (Windows NT 6.1 WOW64 rv:45.0) Gecko/20100101 Firefox/45.0",
            "Mozilla/5.0 (compatible MSIE 9.0 Windows NT 6.1 Trident/5.0 Trident/5.0)",
            "Mozilla/5.0 (Windows NT 6.1 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.96 Safari/537.36",
            "Mozilla/5.0 (X11 Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.96 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0 Win64 x64 rv:54.0) Gecko/20100101 Firefox/54.0",
            "Mozilla/5.0 (iPad CPU OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1",
            "Mozilla/5.0 (Windows NT 10.0 WOW64 rv:52.0) Gecko/20100101 Firefox/52.0",
            "Mozilla/5.0 (Windows NT 6.1 WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36",
            "Mozilla/5.0 (X11 Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36",
            "Mozilla/5.0 (X11 Fedora Linux x86_64 rv:53.0) Gecko/20100101 Firefox/53.0",
            "Mozilla/5.0 (Macintosh Intel Mac OS X 10_11_6) AppleWebKit/601.7.7 (KHTML, like Gecko) Version/9.1.2 Safari/601.7.7",
            "Mozilla/5.0 (Windows NT 10.0 WOW64 Trident/7.0 Touch rv:11.0) like Gecko",
            "Mozilla/5.0 (Windows NT 6.2 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
            "Mozilla/5.0 (Windows NT 6.3 WOW64 Trident/7.0 rv:11.0) like Gecko"
        ]
        return UAs[Math.floor(Math.random() * UAs.length)];
    }
};
