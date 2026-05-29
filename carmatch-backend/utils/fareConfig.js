module.exports = {
  major: {
    bookingFee: 2.5,

    UberX: { base: 2.5, mile: 1.8, minute: 0.3, tax: 0.08 },
    UberXL: { base: 3.5, mile: 2.75, minute: 0.5, tax: 0.08 },
    UberReserve: { base: 5.0, mile: 2.5, minute: 0.45, tax: 0.08 },
    Comfort: { base: 4.0, mile: 2.85, minute: 0.4, tax: 0.08 },
    Green: { base: 2.5, mile: 1.6, minute: 0.28, tax: 0.08 },
    UberBlack: { base: 7.0, mile: 3.5, minute: 0.6, tax: 0.08 },
    UberBlackSUV: { base: 9.0, mile: 4.0, minute: 0.75, tax: 0.08 },
    UberWAV: { base: 2.5, mile: 1.7, minute: 0.35, tax: 0.08 },

    Lyft: { base: 2.0, mile: 1.6, minute: 0.28, tax: 0.08 },
    LyftXL: { base: 3.0, mile: 2.4, minute: 0.45, tax: 0.08 },
    LyftLux: { base: 5.0, mile: 3.2, minute: 0.55, tax: 0.08 },
    LyftBlack: { base: 6.5, mile: 3.8, minute: 0.6, tax: 0.08 },
    LyftLuxBlackXL: { base: 8.0, mile: 4.2, minute: 0.75, tax: 0.08 },

    Taxi: { base: 3.0, mile: 2.5, minute: 0.4, tax: 0.08 }
  },

  mid: {
    bookingFee: 3.0,

    UberX: { base: 2.0, mile: 1.5, minute: 0.25, tax: 0.06 },
    UberXL: { base: 3.0, mile: 2.2, minute: 0.4, tax: 0.06 },
    UberReserve: { base: 4.2, mile: 2.0, minute: 0.35, tax: 0.06 },
    Comfort: { base: 3.2, mile: 2.4, minute: 0.3, tax: 0.06 },
    Green: { base: 2.0, mile: 1.3, minute: 0.25, tax: 0.06 },
    UberBlack: { base: 5.5, mile: 3.0, minute: 0.5, tax: 0.06 },
    UberBlackSUV: { base: 7.0, mile: 3.5, minute: 0.65, tax: 0.06 },
    UberWAV: { base: 2.0, mile: 1.4, minute: 0.3, tax: 0.06 },

    Lyft: { base: 1.8, mile: 1.4, minute: 0.25, tax: 0.06 },
    LyftXL: { base: 2.8, mile: 2.0, minute: 0.4, tax: 0.06 },
    LyftLux: { base: 4.0, mile: 2.7, minute: 0.5, tax: 0.06 },
    LyftBlack: { base: 5.0, mile: 3.2, minute: 0.55, tax: 0.06 },
    LyftLuxBlackXL: { base: 6.5, mile: 3.7, minute: 0.7, tax: 0.06 },

    Taxi: { base: 2.5, mile: 2.2, minute: 0.35, tax: 0.06 }
  },

  rural: {
    bookingFee: 3.5,

    UberX: { base: 1.5, mile: 1.2, minute: 0.2, tax: 0.04 },
    UberXL: { base: 2.2, mile: 1.8, minute: 0.3, tax: 0.04 },
    UberReserve: { base: 3.5, mile: 1.7, minute: 0.3, tax: 0.04 },
    Comfort: { base: 2.5, mile: 2.0, minute: 0.25, tax: 0.04 },
    Green: { base: 1.6, mile: 1.1, minute: 0.2, tax: 0.04 },
    UberBlack: { base: 4.5, mile: 2.5, minute: 0.4, tax: 0.04 },
    UberBlackSUV: { base: 6.0, mile: 3.0, minute: 0.55, tax: 0.04 },
    UberWAV: { base: 1.8, mile: 1.2, minute: 0.25, tax: 0.04 },

    Lyft: { base: 1.5, mile: 1.1, minute: 0.2, tax: 0.04 },
    LyftXL: { base: 2.2, mile: 1.7, minute: 0.3, tax: 0.04 },
    LyftLux: { base: 3.2, mile: 2.2, minute: 0.4, tax: 0.04 },
    LyftBlack: { base: 4.0, mile: 2.6, minute: 0.45, tax: 0.04 },
    LyftLuxBlackXL: { base: 5.5, mile: 3.0, minute: 0.6, tax: 0.04 },

    Taxi: { base: 2.0, mile: 1.8, minute: 0.25, tax: 0.04 }
  }
};
