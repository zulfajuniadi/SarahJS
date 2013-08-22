<?php

$config = array();

function createConfigFile($vars) {
    $str =  "<?php\n\nsetConfig(array(\n";
    foreach ($vars as $key => $value) {
        $str .= "    '" . $key . "' => '" . $value . "',\n";
    }
    $str .= "));";
    file_put_contents('config.php', $str);
}

// require_once('config.php');

var_dump($config);

if(!$config['email']) {
    $app = \Slim\Slim::getInstance();

    $app->get('/setup',function() use($app){
        $app->render("setup.tpl");
    });

    $app->post('/setup',function() use($app){
        $allPostVars = $app->request->post();
        $allPostVars['password'] = md5($allPostVars['password']);
        createConfigFile($allPostVars);
        $app->redirect('/login');
    });
}