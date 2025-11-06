#!/bin/bash
echo "Recent fixes:"
git log -10 --oneline --grep="BUG:" --format="- %s (%h)"