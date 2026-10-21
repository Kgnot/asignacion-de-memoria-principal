(function () {
    const NS = (window.MemSim = window.MemSim || {});

    class AddressingError extends Error {}
    class ProtectionError extends Error {}
    class OutOfMemoryError extends Error {}

    NS.AddressingError = AddressingError;
    NS.ProtectionError = ProtectionError;
    NS.OutOfMemoryError = OutOfMemoryError;
})();