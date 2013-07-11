SVGrab - SVG HTML Extractor
===========================

```
usage: svgrab [-h] [-s SELECTOR] [-o OUTPUT] [-t TIMEOUT] site

Tool to export an SVG element from a website to a file

Positional arguments:
  site                  Website to export SVG from

Optional arguments:
  -h, --help            Show this help message and exit.
  -s SELECTOR, --selector SELECTOR
                        jQuery selector for HTML SVG element
  -o OUTPUT, --output OUTPUT
                        File to save SVG to (defaults to stdout)
  -t TIMEOUT, --timeout TIMEOUT
                        Timeout (in ms) to wait before grabbing SVG element
```
