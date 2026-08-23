// Host-only property tests for include/sdr_dsp/modular_arithmetic.hpp.
//
// This executable deliberately has no AIE/XRT dependency. Build it with UBSan:
//   c++ -std=c++17 -Wall -Wextra -Wconversion -Werror
//       -fsanitize=signed-integer-overflow -fno-sanitize-recover=all
//       tools/test_modular_arithmetic_host.cpp -o modular_host_test

#include <cstdint>
#include <cstdio>
#include <limits>

#include "../include/sdr_dsp/modular_arithmetic.hpp"

namespace {

constexpr int32_t kRInverseModQ = 169;

int16_t reference_montgomery_reduce(int32_t a) {
    int64_t residue = static_cast<int64_t>(a) % sdr_dsp::MOD_Q;
    if (residue < 0) {
        residue += sdr_dsp::MOD_Q;
    }
    return static_cast<int16_t>(
        (residue * kRInverseModQ) % sdr_dsp::MOD_Q);
}

bool check_montgomery(int32_t a) {
    const int16_t expected = reference_montgomery_reduce(a);
    const int16_t actual = sdr_dsp::montgomery_reduce_scalar(a);
    if (actual != expected || actual < 0 || actual >= sdr_dsp::MOD_Q) {
        std::fprintf(
            stderr,
            "Montgomery mismatch for a=%d: expected=%d actual=%d\n",
            a,
            expected,
            actual);
        return false;
    }
    return true;
}

}  // namespace

int main() {
    const int32_t boundary_cases[] = {
        std::numeric_limits<int32_t>::min(),
        std::numeric_limits<int32_t>::min() + 1,
        -109'084'672,
        -1,
        0,
        1,
        109'084'672,
        2'147'483'638,
        std::numeric_limits<int32_t>::max() - 1,
        std::numeric_limits<int32_t>::max(),
    };
    for (const int32_t a : boundary_cases) {
        if (!check_montgomery(a)) {
            return 1;
        }
    }

    uint32_t state = 0xC0FFEEu;
    for (int i = 0; i < 10'000; ++i) {
        state = state * 1664525u + 1013904223u;
        const int32_t a = static_cast<int32_t>(
            static_cast<int64_t>(state) - (int64_t{1} << 31));
        if (!check_montgomery(a)) {
            return 1;
        }
    }

    std::puts("Public modular arithmetic host test: PASS (10,010 cases)");
    return 0;
}
