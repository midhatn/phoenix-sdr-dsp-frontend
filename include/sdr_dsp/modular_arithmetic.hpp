#ifndef MODULAR_ARITHMETIC_HPP
#define MODULAR_ARITHMETIC_HPP

#include <stdint.h>

namespace sdr_dsp {

// Scalar modular helpers for coefficients already reduced to the documented
// bounds. These routines are host-testable without the AIE API.
static constexpr int16_t MOD_Q = 3329;
static constexpr int32_t BARRETT_FACTOR = 20158;
static constexpr int32_t BARRETT_SHIFT = 26;
static constexpr int16_t MONTGOMERY_QINV = -3327;
static constexpr int16_t MONTGOMERY_Q = 3329;

inline int16_t mod_add_scalar(int16_t a, int16_t b, int16_t q = MOD_Q) {
    int32_t res = static_cast<int32_t>(a) + static_cast<int32_t>(b);
    if (res >= q) res -= q;
    return static_cast<int16_t>(res);
}

inline int16_t mod_sub_scalar(int16_t a, int16_t b, int16_t q = MOD_Q) {
    int32_t res = static_cast<int32_t>(a) - static_cast<int32_t>(b);
    if (res < 0) res += q;
    return static_cast<int16_t>(res);
}

inline int16_t barrett_reduce_scalar(int32_t a, int16_t q = MOD_Q) {
    int32_t t = static_cast<int32_t>((static_cast<int64_t>(a) * BARRETT_FACTOR) >> BARRETT_SHIFT);
    int32_t res = a - t * q;
    if (res >= q) res -= q;
    return static_cast<int16_t>(res);
}

inline int16_t montgomery_reduce_scalar(int32_t a) {
    // Compute (a * q^-1) mod 2^16 in unsigned arithmetic. Multiplying the
    // signed int32 inputs directly can overflow.
    const uint32_t k_bits =
        static_cast<uint32_t>(static_cast<uint16_t>(a)) *
        static_cast<uint32_t>(static_cast<uint16_t>(MONTGOMERY_QINV));
    int32_t k = static_cast<int32_t>(k_bits & 0xFFFFu);
    if (k >= (1 << 15)) {
        k -= (1 << 16);
    }
    // The numerator is exactly divisible by 2^16 by construction. Evaluate
    // it in int64_t to support the entire int32_t input domain and avoid both
    // signed overflow and implementation-defined right shift of negatives.
    const int64_t t =
        (static_cast<int64_t>(a) -
         static_cast<int64_t>(k) * MONTGOMERY_Q) /
        (int64_t{1} << 16);
    int64_t canonical = t % MONTGOMERY_Q;
    if (canonical < 0) {
        canonical += MONTGOMERY_Q;
    }
    return static_cast<int16_t>(canonical);
}

} // namespace sdr_dsp

#endif // MODULAR_ARITHMETIC_HPP
