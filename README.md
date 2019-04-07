# FC-Taylor Program

Full constraint (FC) Taylor program useful for generating discrete yield surface data. The program uses the hypoelastic implementation in the SIMLab Crystal Mechanics Model (SCMM-hypo) for solving the single crystal response of each individual grain.

## Compiling

For gfortran, compile the program with `-fopenmp`. For ifort, compile the program with `-openmp`. Remember to increase the Stack size with `-Fn` where `n` is the number of bytes, e.g., `ifort -openmp -F1000000000 main.f`. Note that lines starting with !$ are compiler directives to use OpenMP, i.e., multi-threading.

## Usage

See the SCMM-hypo manual for details.
