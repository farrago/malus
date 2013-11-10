// Just to keep the socket alive
emit("keepalive", {data:"keepalive", query:query.id});