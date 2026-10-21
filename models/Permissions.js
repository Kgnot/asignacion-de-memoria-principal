(function () {
    const NS = (window.MemSim = window.MemSim || {});

    function hasPermissions(granted, requested) {
        return typeof requested === 'string' && [...requested].every((permission) => granted.includes(permission));
    }

    NS.hasPermissions = hasPermissions;
})();