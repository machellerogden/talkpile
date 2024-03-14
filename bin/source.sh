SCRIPT=$(realpath "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
op inject -i "$(realpath "$SCRIPTPATH/../.env.tpl")"
