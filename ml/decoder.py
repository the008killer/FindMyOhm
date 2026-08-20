class ResistorDecoder:

    DIGIT = {
        "black": 0,
        "brown": 1,
        "red": 2,
        "orange": 3,
        "yellow": 4,
        "green": 5,
        "blue": 6,
        "violet": 7,
        "gray": 8,
        "white": 9,
    }

    MULTIPLIER = {
        "silver": 0.01,
        "gold": 0.1,
        "black": 1,
        "brown": 10,
        "red": 100,
        "orange": 1_000,
        "yellow": 10_000,
        "green": 100_000,
        "blue": 1_000_000,
        "violet": 10_000_000,
        "gray": 100_000_000,
        "white": 1_000_000_000,
    }

    TOLERANCE = {
        "brown": 1,
        "red": 2,
        "green": 0.5,
        "blue": 0.25,
        "violet": 0.1,
        "gray": 0.05,
        "gold": 5,
        "silver": 10,
    }

    @staticmethod
    def format_ohms(ohms):
        """Converts raw Ohms into formatted human-readable string."""
        if ohms >= 1e9:
            return f"{ohms/1e9:.2f} GΩ"
        if ohms >= 1e6:
            return f"{ohms/1e6:.2f} MΩ"
        if ohms >= 1e3:
            return f"{ohms/1e3:.2f} kΩ"
        return f"{ohms:.2f} Ω"

    def _score_sequence(self, colors):
        """
        Scores how likely a color sequence is physically valid.
        Higher score = higher probability of correct reading direction.
        """
        score = 0
        n = len(colors)

        first = colors[0]
        last = colors[-1]

        # Rule 1: First band CANNOT be Gold, Silver, or Black
        if first in ["gold", "silver"]:
            score -= 100  # Impossible
        if first == "black" and n > 1:
            score -= 50  # Very rare/invalid

        # Rule 2: Last band SHOULD be a valid tolerance color
        if last in ["gold", "silver"]:
            score += 30  # Standard 4-band tolerance
        elif last == "brown":
            score += 25  # Standard 5-band 1% tolerance
        elif last == "red":
            score += 15  # Standard 2% tolerance
        elif last in self.TOLERANCE:
            score += 10

        # Rule 3: Multiplier band (penultimate) validity
        mult_candidate = colors[-2] if n in [4, 5] else colors[-3]
        if mult_candidate in self.MULTIPLIER:
            score += 10

        return score

    def _calculate(self, colors):
        """Performs raw resistance calculation for a given color list."""
        n = len(colors)
        if n == 4:
            val = (
                10 * self.DIGIT[colors[0]] + self.DIGIT[colors[1]]
            ) * self.MULTIPLIER[colors[2]]
            tol = self.TOLERANCE.get(colors[3], "?")
        elif n in [5, 6]:
            val = (
                100 * self.DIGIT[colors[0]]
                + 10 * self.DIGIT[colors[1]]
                + self.DIGIT[colors[2]]
            ) * self.MULTIPLIER[colors[3]]
            tol = self.TOLERANCE.get(colors[4], "?")
        else:
            raise ValueError(f"Unsupported band count: {n}")

        return val, tol

    def decode(self, raw_colors):
        """
        Decodes colors by trying BOTH forward and reversed directions,
        selecting the sequence that represents a valid resistor code.
        """
        if not raw_colors:
            return {"error": "No color bands provided"}

        # Normalize to lowercase
        colors_fwd = [c.lower() for c in raw_colors]
        colors_rev = colors_fwd[::-1]

        n = len(colors_fwd)
        if n not in [4, 5, 6]:
            return {
                "error": f"Expected 4, 5, or 6 bands, detected {n}",
                "colors_detected": raw_colors,
            }

        # Score both direction candidates
        score_fwd = self._score_sequence(colors_fwd)
        score_rev = self._score_sequence(colors_rev)

        # Select direction with highest score
        if score_rev > score_fwd:
            selected_colors = colors_rev
            direction = "reversed"
        else:
            selected_colors = colors_fwd
            direction = "forward"

        try:
            val, tol = self._calculate(selected_colors)
            return {
                "ohms": val,
                "formatted": self.format_ohms(val),
                "tolerance": f"±{tol}%",
                "colors": selected_colors,
                "direction": direction,
            }
        except KeyError as e:
            # If selected direction fails, try fallback direction
            fallback_colors = (
                colors_rev if selected_colors == colors_fwd else colors_fwd
            )
            try:
                val, tol = self._calculate(fallback_colors)
                return {
                    "ohms": val,
                    "formatted": self.format_ohms(val),
                    "tolerance": f"±{tol}%",
                    "colors": fallback_colors,
                    "direction": "fallback",
                }
            except KeyError:
                return {
                    "error": f"Invalid color for position: {e}",
                    "colors": selected_colors,
                }